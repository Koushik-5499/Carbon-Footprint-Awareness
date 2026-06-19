const express = require('express');
const router = express.Router();
const challengeController = require('../controllers/challengeController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, challengeController.getAllChallenges);
router.post('/complete', authMiddleware, challengeController.completeChallenge);

module.exports = router;
