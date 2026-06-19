const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

// For a simple hackathon app, we'll protect with authMiddleware, and we can assume any authorized user can access stats.
router.get('/stats', authMiddleware, adminController.getStats);
router.post('/challenges', authMiddleware, adminController.addChallenge);

module.exports = router;
