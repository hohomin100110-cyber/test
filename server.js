const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const { Client } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const client = new Client({
    connectionString: process.env.DATABASE_URL
});
client.connect();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 } // 1 week
}));

app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await client.query(
            'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id',
            [username, hashedPassword]
        );
        res.json({ success: true, userId: result.rows[0].id });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password, autoLogin } = req.body;
    try {
        const result = await client.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            if (await bcrypt.compare(password, user.password)) {
                req.session.userId = user.id;
                req.session.username = user.username;
                res.json({ success: true, username: user.username });
            } else {
                res.status(401).json({ error: 'Invalid password' });
            }
        } else {
            res.status(401).json({ error: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy(() => {
        res.json({ success: true });
    });
});

app.get('/api/me', (req, res) => {
    if (req.session.userId) {
        res.json({ loggedIn: true, username: req.session.username, userId: req.session.userId });
    } else {
        res.json({ loggedIn: false });
    }
});

// Post Routes
app.get('/api/posts', async (req, res) => {
    try {
        const result = await client.query(`
            SELECT p.*, u.username 
            FROM posts p 
            JOIN users u ON p.user_id = u.id 
            ORDER BY p.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/posts', async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
    const { title, content } = req.body;
    try {
        const result = await client.query(
            'INSERT INTO posts (user_id, title, content) VALUES ($1, $2, $3) RETURNING *',
            [req.session.userId, title, content]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/posts/:id', async (req, res) => {
    try {
        const result = await client.query(`
            SELECT p.*, u.username 
            FROM posts p 
            JOIN users u ON p.user_id = u.id 
            WHERE p.id = $1
        `, [req.params.id]);
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'Post not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/posts/:id', async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
    const { title, content } = req.body;
    try {
        const result = await client.query(
            'UPDATE posts SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND user_id = $4 RETURNING *',
            [title, content, req.params.id, req.session.userId]
        );
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(403).json({ error: 'Forbidden or Post not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/posts/:id', async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const result = await client.query(
            'DELETE FROM posts WHERE id = $1 AND user_id = $2 RETURNING *',
            [req.params.id, req.session.userId]
        );
        if (result.rows.length > 0) {
            res.json({ success: true });
        } else {
            res.status(403).json({ error: 'Forbidden or Post not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Static files handles the index.html
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});