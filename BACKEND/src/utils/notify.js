const db = require('../config/db');

/**
 * Mengirim notifikasi ke semua member di dalam workspace kecuali user pengecualian.
 * @param {number} workspaceId - ID Workspace
 * @param {number} excludeUserId - ID User yang tidak perlu dinotifikasi (misal: yang melakukan aksi)
 * @param {string} title - Judul Notifikasi
 * @param {string} message - Isi Notifikasi
 */
const notifyWorkspaceMembers = async (workspaceId, excludeUserId, title, message) => {
    try {
        const [members] = await db.execute(
            'SELECT user_id FROM workspace_members WHERE workspace_id = ? AND user_id != ?',
            [workspaceId, excludeUserId]
        );
        for (const m of members) {
            await db.execute(
                'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
                [m.user_id, title, message]
            );
        }
    } catch (err) {
        console.error('Error sending workspace notification:', err);
    }
};

module.exports = { notifyWorkspaceMembers };
