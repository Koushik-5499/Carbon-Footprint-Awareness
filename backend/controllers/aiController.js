const fs = require('fs');
const path = require('path');

const usersFilePath = path.join(__dirname, '../data/users.json');
const getUsers = () => JSON.parse(fs.readFileSync(usersFilePath));

exports.askAi = async (req, res) => {
    const { question } = req.body;

    try {
        const response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: 'system',
                        content: 'You are an AI Sustainability Assistant for EcoTrack. Keep answers concise, friendly, and focused on reducing carbon footprints.'
                    },
                    {
                        role: 'user',
                        content: question
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('AI API Error:', errorText);
            return res.status(500).json({ error: 'Failed to get response from AI' });
        }

        const answer = await response.text();
        res.json({ answer });

    } catch (error) {
        console.error('AI Error:', error);
        res.status(500).json({ error: 'Failed to process AI request' });
    }
};

exports.getRecommendations = async (req, res) => {
    const userId = req.user.userId;
    const users = getUsers();
    const user = users.find(u => u.id === userId);

    if (!user || user.footprintHistory.length === 0) {
        return res.json({ recommendations: "Start logging your carbon footprint to get personalized recommendations!" });
    }

    const latestFootprint = user.footprintHistory[user.footprintHistory.length - 1];

    try {
        const prompt = `Based on this user's recent carbon footprint data (in kg CO2e): Transport: ${latestFootprint.emissions.transport}, Electricity: ${latestFootprint.emissions.electricity}, Water: ${latestFootprint.emissions.water}, Gas: ${latestFootprint.emissions.gas}, Waste: ${latestFootprint.emissions.waste}. Provide 3 short, highly actionable tips to reduce their highest emission areas.`;

        const response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful sustainability assistant. Provide 3 short, bulleted, actionable tips.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('AI API Error:', errorText);
            return res.status(500).json({ error: 'Failed to get recommendations from AI' });
        }

        const recommendations = await response.text();
        res.json({ recommendations });

    } catch (error) {
        console.error('AI Error:', error);
        res.status(500).json({ error: 'Failed to process AI request' });
    }
};
