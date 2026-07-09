const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authMiddleware = require('../middleware/authMiddleware');
const { register, login, updateUserRole } = require('../controller/authController');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // max 10 attempts per IP per window
    message: {
        success: false,
        message: 'Too many attempts, please try again after 15 minutes'
    }
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.put('/role', authMiddleware, updateUserRole);

module.exports = router;
