const express = require('express');
const router = express.Router();
const calculatorController = require('../controllers/calculatorController');
const authMiddleware = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
    }
    next();
};

router.post('/', [
    authMiddleware,
    body('transport')
        .optional({ nullable: true, checkFalsy: true })
        .isFloat({ min: 0 })
        .withMessage('Invalid input for transport. Must be a non-negative number.'),
    body('electricity')
        .optional({ nullable: true, checkFalsy: true })
        .isFloat({ min: 0 })
        .withMessage('Invalid input for electricity. Must be a non-negative number.'),
    body('water')
        .optional({ nullable: true, checkFalsy: true })
        .isFloat({ min: 0 })
        .withMessage('Invalid input for water. Must be a non-negative number.'),
    body('gas')
        .optional({ nullable: true, checkFalsy: true })
        .isFloat({ min: 0 })
        .withMessage('Invalid input for gas. Must be a non-negative number.'),
    body('waste')
        .optional({ nullable: true, checkFalsy: true })
        .isFloat({ min: 0 })
        .withMessage('Invalid input for waste. Must be a non-negative number.'),
    validateRequest
], calculatorController.calculate);

module.exports = router;
