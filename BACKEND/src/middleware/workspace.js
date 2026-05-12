const db = require('../config/db');

// Check if user is a member (any role) of the workspace
const isMember = async (req, res, next) => {
    const workspaceId = req.params.workspaceId || req.body.workspace_id;
    const userId = req.user.id;

    try {
        const [rows] = await db.execute(
            'SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
            [workspaceId, userId]
        );

        if (rows.length === 0) {
            return res.status(403).json({ success: false, message: 'Access denied. You are not a member of this workspace.' });
        }

        req.memberRole = rows[0].role;
        next();
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// Check if user is the owner of the workspace
const isOwner = async (req, res, next) => {
    const workspaceId = req.params.workspaceId || req.body.workspace_id;
    const userId = req.user.id;

    try {
        const [rows] = await db.execute(
            'SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ? AND role = "owner"',
            [workspaceId, userId]
        );

        if (rows.length === 0) {
            return res.status(403).json({ success: false, message: 'Access denied. Only the workspace owner can do this.' });
        }

        req.memberRole = 'owner';
        next();
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

module.exports = { isMember, isOwner };
