const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const usersFilePath = path.join(__dirname, '../data/users.json');

const getUsers = () => JSON.parse(fs.readFileSync(usersFilePath));
const saveUsers = (users) => fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 4));

// Simple emission factors (kg CO2e per unit)
const EMISSION_FACTORS = {
    transport: 0.21, // per km (average car)
    electricity: 0.82, // per kWh
    water: 0.0015, // per liter
    gas: 1.5, // per kg
    waste: 0.5 // per kg
};

exports.calculate = (req, res) => {
    const { transport, electricity, water, gas, waste } = req.body;
    const userId = req.user.userId;

    const emissions = {
        transport: (transport || 0) * EMISSION_FACTORS.transport,
        electricity: (electricity || 0) * EMISSION_FACTORS.electricity,
        water: (water || 0) * EMISSION_FACTORS.water,
        gas: (gas || 0) * EMISSION_FACTORS.gas,
        waste: (waste || 0) * EMISSION_FACTORS.waste
    };

    const totalEmissions = Object.values(emissions).reduce((acc, curr) => acc + curr, 0);

    const users = getUsers();
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

    saveUsers(users);

    res.json({ message: 'Calculation successful', record, newScore: users[userIndex].score });
};
