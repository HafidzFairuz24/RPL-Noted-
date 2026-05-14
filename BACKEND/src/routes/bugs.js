const express = require('express');
const router = express.Router();
const bugController = require('../controllers/bugController');
const authMiddleware = require('../middleware/auth');

router.post('/', authMiddleware, bugController.createBugReport);
router.get('/', authMiddleware, bugController.getAllBugReports);
router.get('/admin', authMiddleware, bugController.getAllBugReportsAdmin);
router.put('/:id/status', authMiddleware, bugController.updateBugStatus);

module.exports = router;
