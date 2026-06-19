const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

const usersFilePath = path.join(__dirname, '../data/users.json');

// Helper function to read users
const getUsers = () => {
    const data = fs.readFileSync(usersFilePath);
    return JSON.parse(data);
};

// Helper function to write users
const saveUsers = (users) => {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 4));
};

exports.register = (req, res) => {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Please provide all required fields' });
    }

    const users = getUsers();
    
    // Check if user exists
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ error: 'User already exists' });
    }

    const newUser = {
        id: uuidv4(),
        name,
        email,
        password, // In a real app, hash this!
        score: 0,
        footprintHistory: [],
        completedChallenges: []
    };

    users.push(newUser);
    saveUsers(users);

    const token = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET || 'your_super_secret_jwt_key_here', { expiresIn: '7d' });

    res.status(201).json({ message: 'User registered successfully', token, user: { id: newUser.id, name: newUser.name, email: newUser.email, score: newUser.score } });
};

exports.login = (req, res) => {
    const { email, password } = req.body;

    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'your_super_secret_jwt_key_here', { expiresIn: '7d' });

    res.status(200).json({ message: 'Login successful', token, user: { id: user.id, name: user.name, email: user.email, score: user.score } });
};

exports.getProfile = (req, res) => {
    const users = getUsers();
    const user = users.find(u => u.id === req.user.userId);
    if(!user) return res.status(404).json({error: 'User not found'});
    
    // Don't send password
    const { password, ...userProfile } = user;
    res.json(userProfile);
};
