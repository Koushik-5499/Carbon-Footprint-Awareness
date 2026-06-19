const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const usersFilePath = path.join(__dirname, '../data/users.json');
const challengesFilePath = path.join(__dirname, '../data/challenges.json');

const getUsers = () => JSON.parse(fs.readFileSync(usersFilePath));
const getChallenges = () => JSON.parse(fs.readFileSync(challengesFilePath));
const saveChallenges = (challenges) => fs.writeFileSync(challengesFilePath, JSON.stringify(challenges, null, 4));

exports.getStats = (req, res) => {
    const users = getUsers();
    const challenges = getChallenges();

    const totalUsers = users.length;
    let totalEmissions = 0;
    let totalChallengesCompleted = 0;

    users.forEach(user => {
        totalChallengesCompleted += user.completedChallenges.length;
        user.footprintHistory.forEach(history => {
            totalEmissions += history.total;
        });
    });

    res.json({
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
};

exports.addChallenge = (req, res) => {
    const { title, description, points, type } = req.body;
    
    if (!title || !description || !points || !type) {
        return res.status(400).json({ error: 'All challenge fields are required' });
    }

    const challenges = getChallenges();
    const newChallenge = {
        id: uuidv4(),
        title,
        description,
        points: parseInt(points),
        type
    };

    challenges.push(newChallenge);
    saveChallenges(challenges);

    res.status(201).json({ message: 'Challenge added successfully', challenge: newChallenge });
};
