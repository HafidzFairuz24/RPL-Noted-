const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const { register, login, getMe, updateProfile, getUser } = require('../controllers/authController');

router.post('/register', register);
router.post('/login',    login);
router.get('/me',        auth, getMe);
router.put('/profile',   auth, updateProfile);
router.get('/users/:userId', auth, getUser);

module.exports = router;
