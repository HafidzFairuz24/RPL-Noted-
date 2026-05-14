const express = require('express');
const router = express.Router();
const bugController = require('../controllers/bugController');
const { verifyToken } = require('../middleware/auth');

router.post('/', verifyToken, bugController.createBugReport);
router.get('/', verifyToken, bugController.getAllBugReports);

module.exports = router;
