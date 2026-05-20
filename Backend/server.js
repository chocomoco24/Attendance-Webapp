const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'agartala',
    database: 'student_attendance'
});

db.connect((err) => {
    if (err) { console.error('DB connection failed:', err); return; }
    console.log('Connected to MySQL');

    db.query(`
        CREATE TABLE IF NOT EXISTS attendance (
            id INT AUTO_INCREMENT PRIMARY KEY,
            roll_number VARCHAR(20),
            status VARCHAR(10),
            location_url TEXT
        )
    `, (err) => {
        if (err) console.error('Table creation failed:', err);
    });
});

app.post('/attendance', (req, res) => {
    const { roll, status, locationUrl } = req.body;
    db.query(
        'INSERT INTO attendance (roll_number, status, location_url) VALUES (?, ?, ?)',
        [roll, status, locationUrl],
        (err) => {
            if (err) { res.status(500).json({ error: 'Insert failed' }); return; }
            res.json({ success: true });
        }
    );
});

app.get('/attendance', (req, res) => {
    db.query('SELECT * FROM attendance', (err, results) => {
        if (err) { res.status(500).json({ error: 'Fetch failed' }); return; }
        res.json(results);
    });
});

app.listen(3000, () => console.log('Server running on port 3000'));