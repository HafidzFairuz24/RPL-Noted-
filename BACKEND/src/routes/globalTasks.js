const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const { getMyTasks } = require('../controllers/taskController');

router.get('/me', auth, getMyTasks);

module.exports = router;
