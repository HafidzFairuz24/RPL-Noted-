require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
// Izinkan semua origin dari localhost / 127.0.0.1 (untuk dev)
const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:8080',
    'http://127.0.0.1:8080',
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Izinkan semua origin untuk mempermudah koneksi dari Vercel/Localhost
        callback(null, true);
    },
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── DB (init connection pool) ─────────────────────────────────────────────────
const db = require('./config/db');

// Auto-migration
(async () => {
    try {
        await db.execute('ALTER TABLE users ADD COLUMN profile_picture MEDIUMTEXT');
        console.log('Database migrated: added profile_picture to users table.');
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('Database migrated: profile_picture already exists.');
        } else {
            console.error('Database migration failed:', err.message);
        }
    }

    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS bug_reports (
                id          INT AUTO_INCREMENT PRIMARY KEY,
                user_id     INT          NOT NULL,
                title       VARCHAR(200) NOT NULL,
                description TEXT         NOT NULL,
                status      ENUM('open', 'resolved', 'closed') DEFAULT 'open',
                created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
                updated_at  DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('Database migrated: bug_reports table ensured.');
    } catch (err) {
        console.error('Database migration for bug_reports failed:', err.message);
    }
})();

// ── Routes ────────────────────────────────────────────────────────────────────
const authRoutes         = require('./routes/auth');
const workspaceRoutes    = require('./routes/workspaces');
const listRoutes         = require('./routes/lists');
const taskRoutes         = require('./routes/tasks');
const globalTaskRoutes   = require('./routes/globalTasks');
const notificationRoutes = require('./routes/notifications');
const bugRoutes          = require('./routes/bugs');

app.use('/api/auth',          authRoutes);
app.use('/api/workspaces',    workspaceRoutes);

// Lists are nested under workspace
app.use('/api/workspaces/:workspaceId/lists', listRoutes);

// Tasks are nested under list (standalone path for flexibility)
app.use('/api/lists/:listId/tasks', taskRoutes);

// Global tasks (e.g. /api/tasks/me)
app.use('/api/tasks', globalTaskRoutes);

app.use('/api/notifications', notificationRoutes);
app.use('/api/bugs',          bugRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Noted! API is running 🚀', timestamp: new Date() });
});

// ── Root route ────────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "RPL Noted Backend Running 🚀"
    });
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Noted! API running at http://localhost:${PORT}`);
});

module.exports = app;
