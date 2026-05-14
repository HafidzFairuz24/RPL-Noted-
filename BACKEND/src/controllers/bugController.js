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
