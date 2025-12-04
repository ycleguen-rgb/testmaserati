const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

// Config
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// DB init
const db = new sqlite3.Database('./fleet.db');
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS vehicles(id INTEGER PRIMARY KEY, model TEXT, plate TEXT, type TEXT);`);
    db.run(`CREATE TABLE IF NOT EXISTS missions(id INTEGER PRIMARY KEY, concession TEXT, start_date TEXT, end_date TEXT);`);
    db.run(`CREATE TABLE IF NOT EXISTS mission_vehicles(id INTEGER PRIMARY KEY, mission_id INTEGER, vehicle_id INTEGER);`);
    db.run(`CREATE TABLE IF NOT EXISTS inspections(id INTEGER PRIMARY KEY, mission_id INTEGER, vehicle_id INTEGER, keys INTEGER, km INTEGER, fuel TEXT, comments TEXT);`);
});

// Multer config for photo uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Routes
app.get('/', (req, res) => {
    res.send('<h1>Maserati Fleet MVP</h1><p>Admin: <a href="/admin">/admin</a></p>');
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

app.post('/create-mission', (req, res) => {
    const { concession, start_date, end_date, vehicles } = req.body;
    db.run(`INSERT INTO missions(concession, start_date, end_date) VALUES(?,?,?)`, [concession, start_date, end_date], function(err){
        if(err){ return res.send('Erreur création mission'); }
        const missionId = this.lastID;
        const vehicleIds = vehicles.split(',');
        vehicleIds.forEach(v => {
            db.run(`INSERT INTO mission_vehicles(mission_id, vehicle_id) VALUES(?,?)`, [missionId, v]);
        });
        res.send(`Mission créée avec ID ${missionId}. Lien concession: /concession/${missionId}`);
    });
});

app.get('/concession/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'concession.html'));
});

app.post('/submit-inspection/:id', upload.array('photos', 15), (req, res) => {
    const missionId = req.params.id;
    const { vehicle_id, keys, km, fuel, comments } = req.body;
    db.run(`INSERT INTO inspections(mission_id, vehicle_id, keys, km, fuel, comments) VALUES(?,?,?,?,?,?)`, [missionId, vehicle_id, keys, km, fuel, comments], function(err){
        if(err){ return res.send('Erreur enregistrement inspection'); }
        res.send('Inspection enregistrée avec succès');
    });
});

app.get('/dashboard', (req, res) => {
    db.all(`SELECT * FROM missions`, [], (err, rows) => {
        if(err){ return res.send('Erreur dashboard'); }
        let html = '<h1>Dashboard Missions</h1><ul>';
        rows.forEach(r => {
            html += `<li>Mission ${r.id} - ${r.concession} (${r.start_date} au ${r.end_date})</li>`;
        });
        html += '</ul>';
        res.send(html);
    });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
