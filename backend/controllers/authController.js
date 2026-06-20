const path = require('path');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { readJSON, writeJSON } = require('../utils/fileHelpers');
const { JWT_EXPIRY } = require('../config/constants');

const usersFilePath = path.join(__dirname, '../data/users.json');

/**
 * Register a new user
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Please provide all required fields' });
        }

        const users = await readJSON(usersFilePath);
        
        // Check if user exists
        if (users.find(u => u.email === email)) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = {
            id: uuidv4(),
            name,
            email,
            password: hashedPassword,
            score: 0,
            footprintHistory: [],
            completedChallenges: []
        };

        users.push(newUser);
        await writeJSON(usersFilePath, users);

        const token = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET || 'your_super_secret_jwt_key_here', { expiresIn: JWT_EXPIRY });

        res.status(201).json({ message: 'User registered successfully', token, user: { id: newUser.id, name: newUser.name, email: newUser.email, score: newUser.score } });
    } catch (error) {
        console.error('Error in register:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * Login an existing user
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const users = await readJSON(usersFilePath);
        const user = users.find(u => u.email === email);

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'your_super_secret_jwt_key_here', { expiresIn: JWT_EXPIRY });

        res.status(200).json({ message: 'Login successful', token, user: { id: user.id, name: user.name, email: user.email, score: user.score } });
    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * Get user profile details
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.getProfile = async (req, res) => {
    try {
        const users = await readJSON(usersFilePath);
        const user = users.find(u => u.id === req.user.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        // Don't send password
        const { password, ...userProfile } = user;
        res.status(200).json(userProfile);
    } catch (error) {
        console.error('Error in getProfile:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
