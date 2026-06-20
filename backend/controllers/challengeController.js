const path = require('path');
const { invalidateCache } = require('./leaderboardController');
const { readJSON, writeJSON } = require('../utils/fileHelpers');

const usersFilePath = path.join(__dirname, '../data/users.json');
const challengesFilePath = path.join(__dirname, '../data/challenges.json');

/**
 * Get all available challenges
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.getAllChallenges = async (req, res) => {
    try {
        const challenges = await readJSON(challengesFilePath);
        res.status(200).json(challenges);
    } catch (error) {
        console.error('Error in getAllChallenges:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * Complete a challenge for a user
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.completeChallenge = async (req, res) => {
    try {
        const { challengeId } = req.body;
        const userId = req.user.userId;

        const challenges = await readJSON(challengesFilePath);
        const challenge = challenges.find(c => c.id === challengeId);

        if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

        const users = await readJSON(usersFilePath);
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) return res.status(404).json({ error: 'User not found' });

        // Check if already completed recently (simplified: just check if in list for hackathon)
        if (users[userIndex].completedChallenges.includes(challengeId)) {
            return res.status(400).json({ error: 'Challenge already completed' });
        }

        users[userIndex].completedChallenges.push(challengeId);
        users[userIndex].score += challenge.points;

        await writeJSON(usersFilePath, users);
        invalidateCache();

        res.status(200).json({ message: 'Challenge completed successfully', pointsEarned: challenge.points, newScore: users[userIndex].score });
    } catch (error) {
        console.error('Error in completeChallenge:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
