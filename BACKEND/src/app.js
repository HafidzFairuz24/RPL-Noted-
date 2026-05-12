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
        // Izinkan request tanpa origin (Postman, curl) atau yang ada di daftar
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            // Fallback: izinkan semua origin localhost/127 dengan port apapun
            if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS: ' + origin));
            }
        }
    },
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── DB (init connection pool) ─────────────────────────────────────────────────
require('./config/db');

// ── Routes ────────────────────────────────────────────────────────────────────
const authRoutes         = require('./routes/auth');
const workspaceRoutes    = require('./routes/workspaces');
const listRoutes         = require('./routes/lists');
const taskRoutes         = require('./routes/tasks');
const notificationRoutes = require('./routes/notifications');

app.use('/api/auth',          authRoutes);
app.use('/api/workspaces',    workspaceRoutes);

// Lists are nested under workspace
app.use('/api/workspaces/:workspaceId/lists', listRoutes);

// Tasks are nested under list (standalone path for flexibility)
app.use('/api/lists/:listId/tasks', taskRoutes);

app.use('/api/notifications', notificationRoutes);

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
