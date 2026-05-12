const db = require('../config/db');

// ── GET /api/workspaces ───────────────────────────────────────────────────────
const getMyWorkspaces = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT w.*, wm.role, u.username AS owner_name
             FROM workspaces w
             JOIN workspace_members wm ON wm.workspace_id = w.id
             JOIN users u ON u.id = w.owner_id
             WHERE wm.user_id = ?
             ORDER BY w.created_at DESC`,
            [req.user.id]
        );
        res.json({ success: true, workspaces: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── GET /api/workspaces/:workspaceId ──────────────────────────────────────────
const getWorkspace = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT w.*, u.username AS owner_name
             FROM workspaces w
             JOIN users u ON u.id = w.owner_id
             WHERE w.id = ?`,
            [req.params.workspaceId]
        );
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Workspace not found.' });

        const [members] = await db.execute(
            `SELECT u.id, u.username, u.email, u.profile_picture, wm.role, wm.joined_at
             FROM workspace_members wm
             JOIN users u ON u.id = wm.user_id
             WHERE wm.workspace_id = ?`,
            [req.params.workspaceId]
        );

        res.json({ success: true, workspace: { ...rows[0], members } });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── POST /api/workspaces ──────────────────────────────────────────────────────
const createWorkspace = async (req, res) => {
    const { name, description, background_image } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Workspace name is required.' });

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const [result] = await conn.execute(
            'INSERT INTO workspaces (name, description, background_image, owner_id) VALUES (?, ?, ?, ?)',
            [name, description || null, background_image || null, req.user.id]
        );
        const workspaceId = result.insertId;

        // Auto-add creator as owner
        await conn.execute(
            'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, "owner")',
            [workspaceId, req.user.id]
        );

        await conn.commit();
        res.status(201).json({ success: true, message: 'Workspace created.', workspaceId });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ success: false, message: 'Server error.' });
    } finally {
        conn.release();
    }
};

// ── PUT /api/workspaces/:workspaceId ──────────────────────────────────────────
const updateWorkspace = async (req, res) => {
    const { name, description, background_image } = req.body;
    try {
        const fields = [];
        const values = [];
        if (name !== undefined) { fields.push('name = ?'); values.push(name); }
        if (description !== undefined) { fields.push('description = ?'); values.push(description); }
        if (background_image !== undefined) { fields.push('background_image = ?'); values.push(background_image); }
        
        if (fields.length > 0) {
            values.push(req.params.workspaceId);
            await db.execute(
                `UPDATE workspaces SET ${fields.join(', ')} WHERE id = ?`,
                values
            );
        }
        res.json({ success: true, message: 'Workspace updated.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── DELETE /api/workspaces/:workspaceId ───────────────────────────────────────
const deleteWorkspace = async (req, res) => {
    try {
        await db.execute('DELETE FROM workspaces WHERE id = ?', [req.params.workspaceId]);
        res.json({ success: true, message: 'Workspace deleted.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── POST /api/workspaces/:workspaceId/members ─────────────────────────────────
const addMember = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'User email is required.' });

    try {
        const [users] = await db.execute('SELECT id, username FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(404).json({ success: false, message: 'User not found.' });

        const newUser = users[0];

        const [existing] = await db.execute(
            'SELECT id FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
            [req.params.workspaceId, newUser.id]
        );
        if (existing.length > 0) return res.status(409).json({ success: false, message: 'User is already a member.' });

        await db.execute(
            'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, "member")',
            [req.params.workspaceId, newUser.id]
        );

        // Get workspace name
        const [wsRows] = await db.execute('SELECT name FROM workspaces WHERE id = ?', [req.params.workspaceId]);
        const wsName = wsRows.length > 0 ? wsRows[0].name : 'a workspace';

        // Notify the new member
        await db.execute(
            'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
            [newUser.id, 'Added to Workspace', `Kamu telah ditambahkan ke workspace "${wsName}" oleh ${req.user.username}.`]
        );

        res.status(201).json({ success: true, message: `${newUser.username} added to workspace.` });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── DELETE /api/workspaces/:workspaceId/members/:userId ───────────────────────
const removeMember = async (req, res) => {
    const { userId } = req.params;

    if (parseInt(userId) === req.user.id) {
        return res.status(400).json({ success: false, message: 'Owner cannot remove themselves.' });
    }

    try {
        await db.execute(
            'DELETE FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
            [req.params.workspaceId, userId]
        );
        res.json({ success: true, message: 'Member removed.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── PUT /api/workspaces/:workspaceId/members/:userId ────────────────────────
const updateMemberRole = async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['owner', 'manager', 'member'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role.' });
    }

    if (parseInt(userId) === req.user.id) {
        return res.status(400).json({ success: false, message: 'Owner cannot change their own role here.' });
    }

    try {
        const [result] = await db.execute(
            'UPDATE workspace_members SET role = ? WHERE workspace_id = ? AND user_id = ?',
            [role, req.params.workspaceId, userId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Member not found.' });
        }

        // Dapatkan nama workspace untuk notifikasi
        const [wsRows] = await db.execute('SELECT name FROM workspaces WHERE id = ?', [req.params.workspaceId]);
        if (wsRows.length > 0) {
            const roleName = role === 'manager' ? 'Project Manager' : role === 'owner' ? 'Owner' : 'Member';
            await db.execute(
                'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
                [userId, 'Perubahan Role', `Role kamu di workspace "${wsRows[0].name}" telah diubah menjadi ${roleName} oleh ${req.user.username}.`]
            );
        }

        res.json({ success: true, message: 'Member role updated.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

module.exports = { getMyWorkspaces, getWorkspace, createWorkspace, updateWorkspace, deleteWorkspace, addMember, removeMember, updateMemberRole };
