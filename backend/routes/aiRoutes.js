const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/ask', authMiddleware, aiController.askAi);
router.get('/recommendations', authMiddleware, aiController.getRecommendations);

module.exports = router;
