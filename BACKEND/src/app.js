require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
    origin:      process.env.FRONTEND_URL || '*',
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
