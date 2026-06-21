const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { invalidateCache } = require('./leaderboardController');
const { invalidateAdminStatsCache } = require('./adminController');
const { readJSON, writeJSON } = require('../utils/fileHelpers');
const { EMISSION_FACTORS, GLOBAL_AVERAGE_FOOTPRINT_DAY, TREE_ABSORPTION_RATE } = require('../config/constants');

const usersFilePath = path.join(__dirname, '../data/users.json');

/**
 * Calculate user footprint and update score
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.calculate = async (req, res) => {
    try {
        const { transport, electricity, water, gas, waste } = req.body;
        const userId = req.user.userId;

        // Validate inputs are non-negative numbers
        const inputs = { transport, electricity, water, gas, waste };
        for (const [key, value] of Object.entries(inputs)) {
            if (value !== undefined && value !== null) {
                if (typeof value !== 'number' || value < 0) {
                    return res.status(400).json({ error: `Invalid input for ${key}. Must be a non-negative number.` });
                }
            }
        }

        const emissions = {
            transport: (transport || 0) * EMISSION_FACTORS.transport,
            electricity: (electricity || 0) * EMISSION_FACTORS.electricity,
            water: (water || 0) * EMISSION_FACTORS.water,
            gas: (gas || 0) * EMISSION_FACTORS.gas,
            waste: (waste || 0) * EMISSION_FACTORS.waste
        };

        const totalEmissions = Object.values(emissions).reduce((acc, curr) => acc + curr, 0);

        const users = await readJSON(usersFilePath);
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) return res.status(404).json({ error: 'User not found' });

        const record = {
            id: uuidv4(),
            date: new Date().toISOString(),
            inputs: { transport, electricity, water, gas, waste },
            emissions,
            total: totalEmissions
        };

        users[userIndex].footprintHistory.push(record);
        
        // Simple logic: lower footprint is better, so increase score if footprint is below a threshold
        // Let's just say adding an entry gives a base score, and lower total gives more.
        let scoreAddition = 10; 
        if (totalEmissions < 10) scoreAddition += 20;
        else if (totalEmissions < 30) scoreAddition += 10;
        
        users[userIndex].score += scoreAddition;

        const comparedToAverage = totalEmissions - GLOBAL_AVERAGE_FOOTPRINT_DAY;
        const treesEquivalent = totalEmissions / TREE_ABSORPTION_RATE;

        await writeJSON(usersFilePath, users);
        invalidateCache();
        invalidateAdminStatsCache();

        res.status(201).json({
            message: 'Calculation successful',
            record,
            newScore: users[userIndex].score,
            comparedToAverage: Number(comparedToAverage.toFixed(4)),
            treesEquivalent: Number(treesEquivalent.toFixed(4))
        });
    } catch (error) {
        console.error('Error in calculate:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
