const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

router.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').notEmpty().trim(),
    validateRequest
], authController.register);

router.post('/login', [
    body('email').isEmail(),
    body('password').notEmpty(),
    validateRequest
], authController.login);

router.get('/profile', authMiddleware, authController.getProfile);

module.exports = router;
