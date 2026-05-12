const db = require('../config/db');

// ── GET /api/lists/:listId/tasks ──────────────────────────────────────────────
const getTasks = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT t.*,
                    u1.username AS created_by_name,
                    u2.username AS assigned_to_name
             FROM tasks t
             JOIN users u1 ON u1.id = t.created_by
             LEFT JOIN users u2 ON u2.id = t.assigned_to
             WHERE t.list_id = ?
             ORDER BY 
                FIELD(t.priority,'high','medium','low'),
                t.due_date ASC,
                t.created_at ASC`,
            [req.params.listId]
        );
        res.json({ success: true, tasks: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── GET /api/lists/:listId/tasks/:taskId ──────────────────────────────────────
const getTask = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT t.*,
                    u1.username AS created_by_name,
                    u2.username AS assigned_to_name
             FROM tasks t
             JOIN users u1 ON u1.id = t.created_by
             LEFT JOIN users u2 ON u2.id = t.assigned_to
             WHERE t.id = ? AND t.list_id = ?`,
            [req.params.taskId, req.params.listId]
        );
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Task not found.' });

        // Get comments
        const [comments] = await db.execute(
            `SELECT c.*, u.username
             FROM comments c
             JOIN users u ON u.id = c.user_id
             WHERE c.task_id = ?
             ORDER BY c.created_at ASC`,
            [req.params.taskId]
        );

        res.json({ success: true, task: { ...rows[0], comments } });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── POST /api/lists/:listId/tasks ─────────────────────────────────────────────
const createTask = async (req, res) => {
    const { title, description, status, priority, due_date, assigned_to } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Task title is required.' });

    const validStatus   = ['todo','in_progress','done'];
    const validPriority = ['low','medium','high'];

    if (status   && !validStatus.includes(status))   return res.status(400).json({ success: false, message: 'Invalid status.' });
    if (priority && !validPriority.includes(priority)) return res.status(400).json({ success: false, message: 'Invalid priority.' });

    try {
        const [result] = await db.execute(
            `INSERT INTO tasks (list_id, title, description, status, priority, due_date, assigned_to, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                req.params.listId,
                title,
                description || null,
                status   || 'todo',
                priority || 'medium',
                due_date || null,
                assigned_to || null,
                req.user.id,
            ]
        );

        // Notify assigned user if different from creator
        if (assigned_to && assigned_to !== req.user.id) {
            await db.execute(
                'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
                [assigned_to, 'New Task Assigned', `You have been assigned to task: "${title}".`]
            );
        }

        res.status(201).json({ success: true, message: 'Task created.', taskId: result.insertId });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── PUT /api/lists/:listId/tasks/:taskId ──────────────────────────────────────
const updateTask = async (req, res) => {
    const { title, description, status, priority, due_date, assigned_to } = req.body;
    try {
        await db.execute(
            `UPDATE tasks SET
                title       = COALESCE(?, title),
                description = COALESCE(?, description),
                status      = COALESCE(?, status),
                priority    = COALESCE(?, priority),
                due_date    = COALESCE(?, due_date),
                assigned_to = COALESCE(?, assigned_to)
             WHERE id = ? AND list_id = ?`,
            [
                title || null, description || null,
                status || null, priority || null,
                due_date || null, assigned_to || null,
                req.params.taskId, req.params.listId,
            ]
        );
        res.json({ success: true, message: 'Task updated.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── DELETE /api/lists/:listId/tasks/:taskId ───────────────────────────────────
const deleteTask = async (req, res) => {
    try {
        await db.execute(
            'DELETE FROM tasks WHERE id = ? AND list_id = ?',
            [req.params.taskId, req.params.listId]
        );
        res.json({ success: true, message: 'Task deleted.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

module.exports = { getTasks, getTask, createTask, updateTask, deleteTask };
