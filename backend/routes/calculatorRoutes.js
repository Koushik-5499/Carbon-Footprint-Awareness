const express = require('express');
const router = express.Router();
const calculatorController = require('../controllers/calculatorController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, calculatorController.calculate);

module.exports = router;
