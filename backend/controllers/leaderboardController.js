const path = require('path');
const { readJSON } = require('../utils/fileHelpers');

const usersFilePath = path.join(__dirname, '../data/users.json');

let cache = {
    data: null,
    timestamp: 0
};

exports.invalidateCache = () => {
    cache.data = null;
    cache.timestamp = 0;
};

/**
 * Get the global leaderboard
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.getLeaderboard = async (req, res) => {
    try {
        const now = Date.now();
        if (cache.data && now - cache.timestamp < 30000) {
            return res.status(200).json(cache.data);
        }

        const users = await readJSON(usersFilePath);
        
        // Sort users by score descending
        const sortedUsers = users.sort((a, b) => b.score - a.score);
        
        // Get top 10
        const topUsers = sortedUsers.slice(0, 10).map(u => ({
            id: u.id,
            name: u.name,
            score: u.score
        }));

        cache.data = topUsers;
        cache.timestamp = now;

        res.status(200).json(topUsers);
    } catch (error) {
        console.error('Error in getLeaderboard:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
