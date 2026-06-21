const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
    }
    next();
};

router.post('/ask', [
    authMiddleware,
    body('question').notEmpty().withMessage('Question is required').isString().withMessage('Question must be a string'),
    validateRequest
], aiController.askAi);
router.get('/recommendations', authMiddleware, aiController.getRecommendations);

module.exports = router;
