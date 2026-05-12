const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');

// ── Helper ────────────────────────────────────────────────────────────────────
const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, username: user.username, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// ── POST /api/auth/register ───────────────────────────────────────────────────
const register = async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ success: false, message: 'Username, email, and password are required.' });
    }

    if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    try {
        // Check duplicate
        const [existing] = await db.execute(
            'SELECT id FROM users WHERE email = ? OR username = ?',
            [email, username]
        );
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: 'Username or email already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const [result] = await db.execute(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );

        const user = { id: result.insertId, username, email };
        const token = generateToken(user);

        res.status(201).json({
            success: true,
            message: 'Registration successful.',
            token,
            user,
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    try {
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);

        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const token = generateToken(user);

        res.json({
            success: true,
            message: 'Login successful.',
            token,
            user: { id: user.id, username: user.username, email: user.email, created_at: user.created_at },
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
const getMe = async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT id, username, email, profile_picture, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        res.json({ success: true, user: rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── PUT /api/auth/profile ─────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
    const { username, email, profile_picture } = req.body;
    const userId = req.user.id;

    if (!username && !email && profile_picture === undefined) {
        return res.status(400).json({ success: false, message: 'Provide at least username, email, or profile_picture to update.' });
    }

    try {
        if (username) {
            await db.execute('UPDATE users SET username = ? WHERE id = ?', [username, userId]);
        }
        if (email) {
            await db.execute('UPDATE users SET email = ? WHERE id = ?', [email, userId]);
        }
        if (profile_picture !== undefined) {
            await db.execute('UPDATE users SET profile_picture = ? WHERE id = ?', [profile_picture, userId]);
        }

        const [rows] = await db.execute(
            'SELECT id, username, email, profile_picture, created_at FROM users WHERE id = ?',
            [userId]
        );
        res.json({ success: true, message: 'Profile updated.', user: rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── GET /api/auth/users/:userId ───────────────────────────────────────────────
const getUser = async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT id, username, email, profile_picture, created_at FROM users WHERE id = ?',
            [req.params.userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        res.json({ success: true, user: rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

module.exports = { register, login, getMe, updateProfile, getUser };
