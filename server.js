const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const PORT = 3000;

// Config
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'html');

// DB init
const db = new sqlite3.Database('./fleet.db');
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS vehicles(id INTEGER PRIMARY KEY, model TEXT, plate TEXT, type TEXT);`);
    db.run(`CREATE TABLE IF NOT EXISTS missions(id INTEGER PRIMARY KEY, concession TEXT, start_date TEXT, end_date TEXT);`);
    db.run(`CREATE TABLE IF NOT EXISTS mission_vehicles(id INTEGER PRIMARY KEY, mission_id INTEGER, vehicle_id INTEGER);`);
    db.run(`CREATE TABLE IF NOT EXISTS inspections(id INTEGER PRIMARY KEY, mission_id INTEGER, vehicle_id INTEGER, keys INTEGER, km INTEGER, fuel TEXT, comments TEXT);`);
});

// Routes
app.get('/', (req, res) => {
    res.send('<h1>Maserati Fleet MVP</h1><p>Admin: /admin</p>');
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
