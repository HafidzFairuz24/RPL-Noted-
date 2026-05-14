const db = require('../config/db');

exports.createBugReport = async (req, res) => {
    try {
        const { title, description } = req.body;
        const userId = req.user.id; // from auth middleware

        if (!title || !description) {
            return res.status(400).json({ success: false, message: 'Title and description are required.' });
        }

        const [result] = await db.execute(
            'INSERT INTO bug_reports (user_id, title, description, status) VALUES (?, ?, ?, ?)',
            [userId, title, description, 'open']
        );

        res.status(201).json({
            success: true,
            message: 'Bug report submitted successfully.',
            bugId: result.insertId
        });
    } catch (err) {
        console.error('Error creating bug report:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getAllBugReports = async (req, res) => {
    try {
        // Only return reports for the logged in user to keep it private (or you can make it public/admin only)
        const userId = req.user.id;
        
        const [bugs] = await db.execute(
            'SELECT * FROM bug_reports WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );

        res.json({ success: true, bugs });
    } catch (err) {
        console.error('Error fetching bug reports:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getAllBugReportsAdmin = async (req, res) => {
    try {
        if (req.user.email !== 'hafidzfairuz@gmail.com') {
            return res.status(403).json({ success: false, message: 'Forbidden: Admins only.' });
        }

        const [bugs] = await db.execute(`
            SELECT b.*, u.username, u.email 
            FROM bug_reports b
            JOIN users u ON b.user_id = u.id
            ORDER BY b.created_at DESC
        `);

        res.json({ success: true, bugs });
    } catch (err) {
        console.error('Error fetching admin bug reports:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateBugStatus = async (req, res) => {
    try {
        if (req.user.email !== 'hafidzfairuz@gmail.com') {
            return res.status(403).json({ success: false, message: 'Forbidden: Admins only.' });
        }

        const { id } = req.params;
        const { status } = req.body;

        if (!['open', 'resolved', 'closed'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status.' });
        }

        await db.execute('UPDATE bug_reports SET status = ? WHERE id = ?', [status, id]);
        
        res.json({ success: true, message: 'Status updated successfully.' });
    } catch (err) {
        console.error('Error updating bug status:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
