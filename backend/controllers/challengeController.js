const fs = require('fs');
const path = require('path');

const usersFilePath = path.join(__dirname, '../data/users.json');
const challengesFilePath = path.join(__dirname, '../data/challenges.json');

const getUsers = () => JSON.parse(fs.readFileSync(usersFilePath));
const saveUsers = (users) => fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 4));
const getChallenges = () => JSON.parse(fs.readFileSync(challengesFilePath));

exports.getAllChallenges = (req, res) => {
    const challenges = getChallenges();
    res.json(challenges);
};

exports.completeChallenge = (req, res) => {
    const { challengeId } = req.body;
    const userId = req.user.userId;

    const challenges = getChallenges();
    const challenge = challenges.find(c => c.id === challengeId);

    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) return res.status(404).json({ error: 'User not found' });

    // Check if already completed recently (simplified: just check if in list for hackathon)
    if (users[userIndex].completedChallenges.includes(challengeId)) {
        return res.status(400).json({ error: 'Challenge already completed' });
    }

    users[userIndex].completedChallenges.push(challengeId);
    users[userIndex].score += challenge.points;

    saveUsers(users);

    res.json({ message: 'Challenge completed successfully', pointsEarned: challenge.points, newScore: users[userIndex].score });
};
