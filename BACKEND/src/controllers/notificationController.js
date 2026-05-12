const db = require('../config/db');

// ── GET /api/notifications ────────────────────────────────────────────────────
const getNotifications = async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
            [req.user.id]
        );
        const unreadCount = rows.filter(n => !n.is_read).length;
        res.json({ success: true, notifications: rows, unreadCount });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── PUT /api/notifications/:id/read ──────────────────────────────────────────
const markAsRead = async (req, res) => {
    try {
        await db.execute(
            'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        res.json({ success: true, message: 'Notification marked as read.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── PUT /api/notifications/read-all ──────────────────────────────────────────
const markAllAsRead = async (req, res) => {
    try {
        await db.execute(
            'UPDATE notifications SET is_read = TRUE WHERE user_id = ?',
            [req.user.id]
        );
        res.json({ success: true, message: 'All notifications marked as read.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── DELETE /api/notifications/:id ────────────────────────────────────────────
const deleteNotification = async (req, res) => {
    try {
        await db.execute(
            'DELETE FROM notifications WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        res.json({ success: true, message: 'Notification deleted.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

module.exports = { getNotifications, markAsRead, markAllAsRead, deleteNotification };
