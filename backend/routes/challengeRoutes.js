const express = require('express');
const router = express.Router();
const challengeController = require('../controllers/challengeController');
const authMiddleware = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
    }
    next();
};

router.get('/', authMiddleware, challengeController.getAllChallenges);
router.post('/complete', [
    authMiddleware,
    body('challengeId').notEmpty().withMessage('Challenge ID is required').isString().withMessage('Challenge ID must be a string'),
    validateRequest
], challengeController.completeChallenge);

module.exports = router;
