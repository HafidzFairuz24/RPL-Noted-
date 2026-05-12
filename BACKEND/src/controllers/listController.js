const db = require('../config/db');

const { notifyWorkspaceMembers } = require('../utils/notify');

// ── GET /api/workspaces/:workspaceId/lists ────────────────────────────────────
const getLists = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT l.*, u.username AS created_by_name,
                    COUNT(t.id) AS task_count
             FROM lists l
             JOIN users u ON u.id = l.created_by
             LEFT JOIN tasks t ON t.list_id = l.id
             WHERE l.workspace_id = ?
             GROUP BY l.id
             ORDER BY l.created_at ASC`,
            [req.params.workspaceId]
        );
        res.json({ success: true, lists: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── GET /api/workspaces/:workspaceId/lists/:listId ────────────────────────────
const getList = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT l.*, u.username AS created_by_name
             FROM lists l
             JOIN users u ON u.id = l.created_by
             WHERE l.id = ? AND l.workspace_id = ?`,
            [req.params.listId, req.params.workspaceId]
        );
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'List not found.' });

        res.json({ success: true, list: rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── POST /api/workspaces/:workspaceId/lists ───────────────────────────────────
const createList = async (req, res) => {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'List name is required.' });

    try {
        const [result] = await db.execute(
            'INSERT INTO lists (workspace_id, name, description, created_by) VALUES (?, ?, ?, ?)',
            [req.params.workspaceId, name, description || null, req.user.id]
        );
        
        // Notifikasi ke workspace
        const [wsRows] = await db.execute('SELECT name FROM workspaces WHERE id = ?', [req.params.workspaceId]);
        if (wsRows.length > 0) {
            await notifyWorkspaceMembers(
                req.params.workspaceId,
                req.user.id,
                'List Baru',
                `${req.user.username} membuat list baru "${name}" di workspace "${wsRows[0].name}".`
            );
        }

        res.status(201).json({ success: true, message: 'List created.', listId: result.insertId });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── PUT /api/workspaces/:workspaceId/lists/:listId ────────────────────────────
const updateList = async (req, res) => {
    const { name, description } = req.body;
    try {
        await db.execute(
            'UPDATE lists SET name = COALESCE(?, name), description = COALESCE(?, description) WHERE id = ? AND workspace_id = ?',
            [name || null, description || null, req.params.listId, req.params.workspaceId]
        );
        res.json({ success: true, message: 'List updated.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── DELETE /api/workspaces/:workspaceId/lists/:listId ─────────────────────────
const deleteList = async (req, res) => {
    try {
        await db.execute(
            'DELETE FROM lists WHERE id = ? AND workspace_id = ?',
            [req.params.listId, req.params.workspaceId]
        );
        res.json({ success: true, message: 'List deleted.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

module.exports = { getLists, getList, createList, updateList, deleteList };
