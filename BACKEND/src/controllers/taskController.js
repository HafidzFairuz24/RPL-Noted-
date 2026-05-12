const db = require('../config/db');

// ── GET /api/lists/:listId/tasks ──────────────────────────────────────────────
const getTasks = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT t.*,
                    u1.username AS created_by_name,
                    ta.user_id AS assignee_id,
                    u2.username AS assignee_name,
                    u2.email AS assignee_email
             FROM tasks t
             JOIN users u1 ON u1.id = t.created_by
             LEFT JOIN task_assignees ta ON ta.task_id = t.id
             LEFT JOIN users u2 ON u2.id = ta.user_id
             WHERE t.list_id = ?
             ORDER BY 
                FIELD(t.priority,'high','medium','low'),
                t.due_date ASC,
                t.created_at ASC`,
            [req.params.listId]
        );
        
        const tasksMap = {};
        for (const r of rows) {
            if (!tasksMap[r.id]) {
                tasksMap[r.id] = { ...r, assignees: [] };
                delete tasksMap[r.id].assignee_id;
                delete tasksMap[r.id].assignee_name;
                delete tasksMap[r.id].assignee_email;
            }
            if (r.assignee_id) {
                // Prevent duplicate just in case
                if (!tasksMap[r.id].assignees.find(a => a.id === r.assignee_id)) {
                    tasksMap[r.id].assignees.push({
                        id: r.assignee_id,
                        username: r.assignee_name,
                        email: r.assignee_email
                    });
                }
            }
        }
        
        res.json({ success: true, tasks: Object.values(tasksMap) });
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
                    ta.user_id AS assignee_id,
                    u2.username AS assignee_name,
                    u2.email AS assignee_email
             FROM tasks t
             JOIN users u1 ON u1.id = t.created_by
             LEFT JOIN task_assignees ta ON ta.task_id = t.id
             LEFT JOIN users u2 ON u2.id = ta.user_id
             WHERE t.id = ? AND t.list_id = ?`,
            [req.params.taskId, req.params.listId]
        );
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Task not found.' });

        const taskData = { ...rows[0], assignees: [] };
        delete taskData.assignee_id;
        delete taskData.assignee_name;
        delete taskData.assignee_email;

        for (const r of rows) {
            if (r.assignee_id) {
                if (!taskData.assignees.find(a => a.id === r.assignee_id)) {
                    taskData.assignees.push({
                        id: r.assignee_id,
                        username: r.assignee_name,
                        email: r.assignee_email
                    });
                }
            }
        }

        // Get comments
        const [comments] = await db.execute(
            `SELECT c.*, u.username
             FROM comments c
             JOIN users u ON u.id = c.user_id
             WHERE c.task_id = ?
             ORDER BY c.created_at ASC`,
            [req.params.taskId]
        );

        res.json({ success: true, task: { ...taskData, comments } });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── POST /api/lists/:listId/tasks ─────────────────────────────────────────────
const createTask = async (req, res) => {
    const { title, description, status, priority, due_date, attachment, assignees } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Task title is required.' });

    const validStatus   = ['todo','in_progress','done'];
    const validPriority = ['low','medium','high'];

    if (status   && !validStatus.includes(status))   return res.status(400).json({ success: false, message: 'Invalid status.' });
    if (priority && !validPriority.includes(priority)) return res.status(400).json({ success: false, message: 'Invalid priority.' });

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const [result] = await conn.execute(
            `INSERT INTO tasks (list_id, title, description, status, priority, due_date, attachment, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                req.params.listId,
                title,
                description || null,
                status   || 'todo',
                priority || 'medium',
                due_date || null,
                attachment || null,
                req.user.id,
            ]
        );
        const taskId = result.insertId;

        // Multi assignees
        if (assignees && Array.isArray(assignees)) {
            for (const userId of assignees) {
                await conn.execute('INSERT IGNORE INTO task_assignees (task_id, user_id) VALUES (?, ?)', [taskId, userId]);
                
                if (userId !== req.user.id) {
                    await conn.execute(
                        'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
                        [userId, 'Tugas Baru', `Kamu telah ditugaskan ke task: "${title}".`]
                    );
                }
            }
        }

        await conn.commit();
        res.status(201).json({ success: true, message: 'Task created.', taskId });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ success: false, message: 'Server error.' });
    } finally {
        conn.release();
    }
};

// ── PUT /api/lists/:listId/tasks/:taskId ──────────────────────────────────────
const updateTask = async (req, res) => {
    const { title, description, status, priority, due_date, attachment, assignees } = req.body;
    const conn = await db.getConnection();
    
    try {
        await conn.beginTransaction();

        const fields = [];
        const values = [];
        if (title !== undefined) { fields.push('title = ?'); values.push(title); }
        if (description !== undefined) { fields.push('description = ?'); values.push(description); }
        if (status !== undefined) { fields.push('status = ?'); values.push(status); }
        if (priority !== undefined) { fields.push('priority = ?'); values.push(priority); }
        if (due_date !== undefined) { fields.push('due_date = ?'); values.push(due_date); }
        if (attachment !== undefined) { fields.push('attachment = ?'); values.push(attachment); }

        if (fields.length > 0) {
            values.push(req.params.taskId, req.params.listId);
            await conn.execute(
                `UPDATE tasks SET ${fields.join(', ')} WHERE id = ? AND list_id = ?`,
                values
            );
        }

        // Multi assignees
        if (assignees && Array.isArray(assignees)) {
            await conn.execute('DELETE FROM task_assignees WHERE task_id = ?', [req.params.taskId]);
            for (const userId of assignees) {
                await conn.execute('INSERT IGNORE INTO task_assignees (task_id, user_id) VALUES (?, ?)', [req.params.taskId, userId]);
            }
        }

        await conn.commit();
        res.json({ success: true, message: 'Task updated.' });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ success: false, message: 'Server error.' });
    } finally {
        conn.release();
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
