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

describe('Challenges Integration Tests', () => {
    let mockUsers, mockChallenges;
    let token;

    beforeEach(() => {
        mockUsers = [{
            id: 'user1',
            email: 'test@example.com',
            score: 0,
            completedChallenges: ['challenge-already-completed']
        }];

        mockChallenges = [
            { id: 'challenge-1', title: 'Bike to work', points: 20 },
            { id: 'challenge-already-completed', title: 'Recycle', points: 10 }
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
            if (typeof filePath === 'string' && filePath.includes('users.json')) {
                mockUsers = JSON.parse(data);
                return;
            }
            return actualFs.promises.writeFile(filePath, data, options);
        });

        // Generate a valid token for user1
        token = jwt.sign({ userId: 'user1' }, process.env.JWT_SECRET || 'your_super_secret_jwt_key_here');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('GET /api/challenges returns array', async () => {
        const res = await request(app).get('/api/challenges').set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBeTruthy();
        expect(res.body.length).toBe(2);
        expect(res.body[0].id).toBe('challenge-1');
    });

    test('POST /api/challenges/complete returns 400 if already completed', async () => {
        const res = await request(app)
            .post('/api/challenges/complete')
            .set('Authorization', `Bearer ${token}`)
            .send({ challengeId: 'challenge-already-completed' });
            
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('Challenge already completed');
    });
    
    test('POST /api/challenges/complete returns 200 and points when successful', async () => {
        const res = await request(app)
            .post('/api/challenges/complete')
            .set('Authorization', `Bearer ${token}`)
            .send({ challengeId: 'challenge-1' });
            
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Challenge completed successfully');
        expect(res.body.pointsEarned).toBe(20);
        
        // Ensure user score updated
        expect(mockUsers[0].score).toBe(20);
        expect(mockUsers[0].completedChallenges).toContain('challenge-1');
    });
});
