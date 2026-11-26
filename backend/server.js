
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// MySQL configuration
const dbConfig = {
    host: process.env.DB_HOST || 'mysql',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'appdb',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// GET all messages
app.get('/data', (req, res) => {
    pool.query(
        'SELECT * FROM messages ORDER BY id DESC',
        (err, results) => {
            if (err) {
                console.error('Fetch error:', err.message);
                return res.status(500).json({ error: err.message });
            }

            res.json(results);
        }
    );
});

// POST new message
app.post('/data', (req, res) => {
    const { content } = req.body;

    if (!content || !content.trim()) {
        return res.status(400).json({
            error: 'Content is required'
        });
    }

    pool.query(
        'INSERT INTO messages (content) VALUES (?)',
        [content.trim()],
        (err, result) => {
            if (err) {
                console.error('Insert error:', err.message);
                return res.status(500).json({
                    error: err.message
                });
            }

            console.log('Message inserted into MySQL:', result.insertId);

            res.status(201).json({
                id: result.insertId,
                content: content.trim(),
                message: 'Saved successfully in MySQL'
            });
        }
    );
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        database: 'MySQL'
    });
});

// Start server only after successful MySQL connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('MySQL connection failed:', err.message);
        process.exit(1);
    }

    console.log('Connected successfully to MySQL!');
    connection.release();

    app.listen(port, '0.0.0.0', () => {
        console.log(`Backend running on port ${port}`);
    });
});
