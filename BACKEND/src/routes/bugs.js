const express = require('express');
const router = express.Router();
const bugController = require('../controllers/bugController');
const authMiddleware = require('../middleware/auth');

router.post('/', authMiddleware, bugController.createBugReport);
router.get('/', authMiddleware, bugController.getAllBugReports);

module.exports = router;
