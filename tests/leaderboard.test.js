process.env.PORT = 0;
const request = require('supertest');
const fs = require('fs');
const actualFs = jest.requireActual('fs');

jest.mock('fs', () => ({
    ...jest.requireActual('fs'),
    promises: {
        readFile: jest.fn(),
        writeFile: jest.fn()
    }
}));

const app = require('../backend/server');
const leaderboardController = require('../backend/controllers/leaderboardController');

describe('Leaderboard Integration Tests', () => {
    let mockUsers;

    beforeEach(() => {
        // Ensure cache is fresh at the start of each test
        leaderboardController.invalidateCache();

        mockUsers = [];
        for (let i = 1; i <= 15; i++) {
            mockUsers.push({
                id: `user-${i}`,
                name: `User ${i}`,
                email: `user${i}@example.com`,
                score: i * 10
            });
        }

        fs.promises.readFile.mockImplementation(async (filePath, options) => {
            if (typeof filePath === 'string' && filePath.includes('users.json')) {
                return JSON.stringify(mockUsers);
            }
            return actualFs.promises.readFile(filePath, options);
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('GET /api/leaderboard returns 200 with sorted array', async () => {
        const res = await request(app).get('/api/leaderboard');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBeTruthy();
        
        // Assert sorted order descending by score
        for (let i = 0; i < res.body.length - 1; i++) {
            expect(res.body[i].score).toBeGreaterThanOrEqual(res.body[i + 1].score);
        }
    });

    test('GET /api/leaderboard returns top 10 max', async () => {
        const res = await request(app).get('/api/leaderboard');
        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBe(10);
        
        // Check top user is User 15 with score 150
        expect(res.body[0].name).toBe('User 15');
        expect(res.body[0].score).toBe(150);
    });

    test('Cache is returned on second call within 30 seconds', async () => {
        // Call 1
        const res1 = await request(app).get('/api/leaderboard');
        expect(res1.statusCode).toBe(200);
        expect(res1.body[0].name).toBe('User 15');

        // Modify mock data
        mockUsers[14].name = 'Modified User 15';
        mockUsers[14].score = 999;

        // Call 2 (should hit cache and return old User 15 info)
        const res2 = await request(app).get('/api/leaderboard');
        expect(res2.statusCode).toBe(200);
        expect(res2.body[0].name).toBe('User 15'); // still old name
        expect(res2.body[0].score).toBe(150); // still old score

        // Invalidate cache manually and try again
        leaderboardController.invalidateCache();
        const res3 = await request(app).get('/api/leaderboard');
        expect(res3.statusCode).toBe(200);
        expect(res3.body[0].name).toBe('Modified User 15');
        expect(res3.body[0].score).toBe(999);
    });
});
