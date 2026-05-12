const db = require('../config/db');
const { notifyWorkspaceMembers } = require('../utils/notify');

// ── POST /api/tasks/:taskId/comments ─────────────────────────────────────────
const addComment = async (req, res) => {
    const { content } = req.body;
    if (!content) return res.status(400).json({ success: false, message: 'Comment content is required.' });

    try {
        const [result] = await db.execute(
            'INSERT INTO comments (task_id, user_id, content) VALUES (?, ?, ?)',
            [req.params.taskId, req.user.id, content]
        );

        const [rows] = await db.execute(
            `SELECT c.*, u.username FROM comments c JOIN users u ON u.id = c.user_id WHERE c.id = ?`,
            [result.insertId]
        );

        // Notify workspace members
        const [taskRows] = await db.execute(
            `SELECT t.title, l.workspace_id FROM tasks t JOIN lists l ON l.id = t.list_id WHERE t.id = ?`,
            [req.params.taskId]
        );
        if (taskRows.length > 0) {
            await notifyWorkspaceMembers(
                taskRows[0].workspace_id,
                req.user.id,
                'Komentar Baru',
                `${req.user.username} menambahkan komentar pada task "${taskRows[0].title}".`
            );
        }

        res.status(201).json({ success: true, message: 'Comment added.', comment: rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── PUT /api/tasks/:taskId/comments/:commentId ────────────────────────────────
const updateComment = async (req, res) => {
    const { content } = req.body;
    if (!content) return res.status(400).json({ success: false, message: 'Content is required.' });

    try {
        const [rows] = await db.execute('SELECT user_id FROM comments WHERE id = ? AND task_id = ?', [req.params.commentId, req.params.taskId]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Comment not found.' });
        if (rows[0].user_id !== req.user.id) return res.status(403).json({ success: false, message: 'You can only edit your own comments.' });

        await db.execute('UPDATE comments SET content = ? WHERE id = ?', [content, req.params.commentId]);
        res.json({ success: true, message: 'Comment updated.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── DELETE /api/tasks/:taskId/comments/:commentId ─────────────────────────────
const deleteComment = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT user_id FROM comments WHERE id = ? AND task_id = ?', [req.params.commentId, req.params.taskId]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Comment not found.' });
        if (rows[0].user_id !== req.user.id) return res.status(403).json({ success: false, message: 'You can only delete your own comments.' });

        await db.execute('DELETE FROM comments WHERE id = ?', [req.params.commentId]);
        res.json({ success: true, message: 'Comment deleted.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

module.exports = { addComment, updateComment, deleteComment };
