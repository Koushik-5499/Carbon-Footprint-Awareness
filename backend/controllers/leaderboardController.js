const fs = require('fs');
const path = require('path');

const usersFilePath = path.join(__dirname, '../data/users.json');

const getUsers = () => JSON.parse(fs.readFileSync(usersFilePath));

exports.getLeaderboard = (req, res) => {
    const users = getUsers();
    
    // Sort users by score descending
    const sortedUsers = users.sort((a, b) => b.score - a.score);
    
    // Get top 10
    const topUsers = sortedUsers.slice(0, 10).map(u => ({
        id: u.id,
        name: u.name,
        score: u.score
    }));

    res.json(topUsers);
};
