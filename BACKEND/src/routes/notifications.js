const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const { getNotifications, markAsRead, markAllAsRead, deleteNotification } = require('../controllers/notificationController');

router.get('/',                  auth, getNotifications);
router.put('/read-all',          auth, markAllAsRead);
router.put('/:id/read',          auth, markAsRead);
router.delete('/:id',            auth, deleteNotification);

module.exports = router;
