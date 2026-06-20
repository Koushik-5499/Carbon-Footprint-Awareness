const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { readJSON, writeJSON } = require('../utils/fileHelpers');

const usersFilePath = path.join(__dirname, '../data/users.json');
const challengesFilePath = path.join(__dirname, '../data/challenges.json');

/**
 * Get dashboard statistics
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.getStats = async (req, res) => {
    try {
        const users = await readJSON(usersFilePath);
        const challenges = await readJSON(challengesFilePath);

        const totalUsers = users.length;
        let totalEmissions = 0;
        let totalChallengesCompleted = 0;

        users.forEach(user => {
            totalChallengesCompleted += user.completedChallenges.length;
            user.footprintHistory.forEach(history => {
                totalEmissions += history.total;
            });
        });

        res.status(200).json({
            totalUsers,
            totalEmissions: parseFloat(totalEmissions.toFixed(2)),
            totalChallengesCompleted,
            totalChallenges: challenges.length,
            users: users.map(u => ({
                id: u.id,
                name: u.name,
                email: u.email,
                score: u.score,
                entriesCount: u.footprintHistory.length
            }))
        });
    } catch (error) {
        console.error('Error in getStats:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * Add a new challenge
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.addChallenge = async (req, res) => {
    try {
        const { title, description, points, type } = req.body;
        
        if (!title || !description || !points || !type) {
            return res.status(400).json({ error: 'All challenge fields are required' });
        }

        const challenges = await readJSON(challengesFilePath);
        const newChallenge = {
            id: uuidv4(),
            title,
            description,
            points: parseInt(points),
            type
        };

        challenges.push(newChallenge);
        await writeJSON(challengesFilePath, challenges);

        res.status(201).json({ message: 'Challenge added successfully', challenge: newChallenge });
    } catch (error) {
        console.error('Error in addChallenge:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
