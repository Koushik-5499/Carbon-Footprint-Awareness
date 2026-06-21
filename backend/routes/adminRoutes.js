const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
    }
    next();
};

// For a simple hackathon app, we'll protect with authMiddleware, and we can assume any authorized user can access stats.
router.get('/stats', authMiddleware, adminController.getStats);
router.post('/challenges', [
    authMiddleware,
    body('title').notEmpty().withMessage('All challenge fields are required').isString(),
    body('description').notEmpty().withMessage('All challenge fields are required').isString(),
    body('points').notEmpty().withMessage('All challenge fields are required').custom(val => {
        const parsed = parseInt(val, 10);
        if (isNaN(parsed) || parsed <= 0) {
            throw new Error('All challenge fields are required');
        }
        return true;
    }),
    body('type').notEmpty().withMessage('All challenge fields are required').isIn(['daily', 'weekly']).withMessage('All challenge fields are required'),
    validateRequest
], adminController.addChallenge);

module.exports = router;
