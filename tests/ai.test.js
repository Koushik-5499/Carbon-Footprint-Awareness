process.env.PORT = 0;
const request = require('supertest');
const fs = require('fs');
const actualFs = jest.requireActual('fs');
const jwt = require('jsonwebtoken');

jest.mock('fs', () => ({
    ...jest.requireActual('fs'),
    promises: {
        readFile: jest.fn(),
        writeFile: jest.fn()
    }
}));

const app = require('../backend/server');

describe('AI Assistant Integration Tests', () => {
    let mockUsers;
    let token;

    beforeAll(() => {
        global.fetch = jest.fn();
    });

    beforeEach(() => {
        mockUsers = [{
            id: 'user1',
            email: 'test@example.com',
            name: 'Test User',
            score: 10,
            footprintHistory: [
                {
                    total: 15.5,
                    emissions: {
                        transport: 5,
                        electricity: 5,
                        water: 1.5,
                        gas: 2,
                        waste: 2
                    }
                }
            ],
            completedChallenges: []
        }];

        fs.promises.readFile.mockImplementation(async (filePath, options) => {
            if (typeof filePath === 'string' && filePath.includes('users.json')) {
                return JSON.stringify(mockUsers);
            }
            return actualFs.promises.readFile(filePath, options);
        });

        token = jwt.sign({ userId: 'user1' }, process.env.JWT_SECRET || 'your_super_secret_jwt_key_here');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('POST /api/ai/ask returns 200 with AI answer', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            text: async () => 'To reduce your carbon footprint, you can take public transit or plant trees.'
        });

        const res = await request(app)
            .post('/api/ai/ask')
            .set('Authorization', `Bearer ${token}`)
            .send({ question: 'How can I reduce emissions?' });

        expect(res.statusCode).toBe(200);
        expect(res.body.answer).toBe('To reduce your carbon footprint, you can take public transit or plant trees.');
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('POST /api/ai/ask returns 500 when AI fetch fails', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            text: async () => 'AI API is currently unavailable.'
        });

        const res = await request(app)
            .post('/api/ai/ask')
            .set('Authorization', `Bearer ${token}`)
            .send({ question: 'How can I reduce emissions?' });

        expect(res.statusCode).toBe(500);
        expect(res.body.error).toBe('Failed to get response from AI');
    });

    test('POST /api/ai/ask returns 500 when AI fetch throws error', async () => {
        global.fetch.mockRejectedValueOnce(new Error('Network error'));

        const res = await request(app)
            .post('/api/ai/ask')
            .set('Authorization', `Bearer ${token}`)
            .send({ question: 'How can I reduce emissions?' });

        expect(res.statusCode).toBe(500);
        expect(res.body.error).toBe('Failed to process AI request');
    });

    test('GET /api/ai/recommendations returns 200 with recommendations', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            text: async () => '1. Walk or ride a bike for short distances.\n2. Turn off lights when not in use.\n3. Compost organic waste.'
        });

        const res = await request(app)
            .get('/api/ai/recommendations')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.recommendations).toContain('Walk or ride a bike');
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('GET /api/ai/recommendations returns message when user has no footprints', async () => {
        mockUsers[0].footprintHistory = [];

        const res = await request(app)
            .get('/api/ai/recommendations')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.recommendations).toContain('Start logging your carbon footprint');
        expect(global.fetch).not.toHaveBeenCalled();
    });

    test('GET /api/ai/recommendations returns 500 when AI fetch fails', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            text: async () => 'Error recommendations request'
        });

        const res = await request(app)
            .get('/api/ai/recommendations')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(500);
        expect(res.body.error).toBe('Failed to get recommendations from AI');
    });

    test('GET /api/ai/recommendations returns 500 when AI fetch throws error', async () => {
        global.fetch.mockRejectedValueOnce(new Error('Internal fetch issue'));

        const res = await request(app)
            .get('/api/ai/recommendations')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(500);
        expect(res.body.error).toBe('Failed to process AI request');
    });
});
