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

describe('Admin Integration Tests', () => {
    let mockUsers, mockChallenges;
    let token;

    beforeEach(() => {
        mockUsers = [{
            id: 'user1',
            email: 'test@example.com',
            name: 'Test User',
            score: 10,
            footprintHistory: [{ total: 50.5 }, { total: 20.3 }],
            completedChallenges: ['challenge-1']
        }];

        mockChallenges = [
            { id: 'challenge-1', title: 'Recycle', points: 10, type: 'daily' }
        ];

        fs.promises.readFile.mockImplementation(async (filePath, options) => {
            if (typeof filePath === 'string') {
                if (filePath.includes('users.json')) {
                    return JSON.stringify(mockUsers);
                }
                if (filePath.includes('challenges.json')) {
                    return JSON.stringify(mockChallenges);
                }
            }
            return actualFs.promises.readFile(filePath, options);
        });

        fs.promises.writeFile.mockImplementation(async (filePath, data, options) => {
            if (typeof filePath === 'string') {
                if (filePath.includes('users.json')) {
                    mockUsers = JSON.parse(data);
                    return;
                }
                if (filePath.includes('challenges.json')) {
                    mockChallenges = JSON.parse(data);
                    return;
                }
            }
            return actualFs.promises.writeFile(filePath, data, options);
        });

        token = jwt.sign({ userId: 'user1' }, process.env.JWT_SECRET || 'your_super_secret_jwt_key_here');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('GET /api/admin/stats returns 200 with totalUsers, totalEmissions, totalChallenges', async () => {
        const res = await request(app)
            .get('/api/admin/stats')
            .set('Authorization', `Bearer ${token}`);
            
        expect(res.statusCode).toBe(200);
        expect(res.body.totalUsers).toBe(1);
        expect(res.body.totalEmissions).toBe(70.8); // 50.5 + 20.3
        expect(res.body.totalChallenges).toBe(1);
        expect(res.body.totalChallengesCompleted).toBe(1);
    });

    test('POST /api/admin/challenges creates a new challenge with title, description, points, type', async () => {
        const res = await request(app)
            .post('/api/admin/challenges')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'Plant a tree',
                description: 'Plant a local tree in your garden.',
                points: 100,
                type: 'weekly'
            });
            
        expect(res.statusCode).toBe(201);
        expect(res.body.message).toBe('Challenge added successfully');
        expect(res.body.challenge.title).toBe('Plant a tree');
        expect(res.body.challenge.points).toBe(100);
        expect(mockChallenges.length).toBe(2);
        expect(mockChallenges[1].title).toBe('Plant a tree');
    });

    test('POST /api/admin/challenges returns 400 if missing fields', async () => {
        const res = await request(app)
            .post('/api/admin/challenges')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'Plant a tree',
                description: 'Plant a local tree.'
                // missing points and type
            });
            
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('All challenge fields are required');
    });
});
