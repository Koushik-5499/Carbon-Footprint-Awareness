process.env.PORT = 0;
const request = require('supertest');
const fs = require('fs');
const actualFs = jest.requireActual('fs');
const jwt = require('jsonwebtoken');

// Require controllers directly for direct error path testing
const authController = require('../backend/controllers/authController');
const calculatorController = require('../backend/controllers/calculatorController');
const challengeController = require('../backend/controllers/challengeController');
const adminController = require('../backend/controllers/adminController');
const leaderboardController = require('../backend/controllers/leaderboardController');

jest.mock('fs', () => ({
    ...jest.requireActual('fs'),
    promises: {
        readFile: jest.fn(),
        writeFile: jest.fn()
    }
}));

const app = require('../backend/server');

describe('Exception, Page Serving & Middleware Integration Tests', () => {
    let mockUsers, mockChallenges;
    let token, expiredToken, invalidToken;

    beforeEach(() => {
        mockUsers = [{
            id: 'user1',
            email: 'test@example.com',
            name: 'Test User',
            score: 10,
            footprintHistory: [{ total: 10.5 }],
            completedChallenges: []
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

        const secret = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';
        token = jwt.sign({ userId: 'user1' }, secret);
        expiredToken = jwt.sign({ userId: 'user1' }, secret, { expiresIn: '-10s' });
        invalidToken = 'Bearer completelyinvalidtokenstring123';
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // 1. HTML Page Routes and Fallback tests (for server.js coverage)
    test('GET html page routes return 200', async () => {
        const pages = [
            '/',
            '/dashboard.html',
            '/calculator.html',
            '/challenges.html',
            '/leaderboard.html',
            '/ai-assistant.html',
            '/admin.html'
        ];
        for (const page of pages) {
            const res = await request(app).get(page);
            expect(res.statusCode).toBe(200);
            expect(res.text).toContain('<!DOCTYPE html>');
        }
    });

    test('GET non-existent page redirects to index.html (fallback)', async () => {
        const res = await request(app).get('/some-random-route');
        expect(res.statusCode).toBe(200);
        expect(res.text).toContain('<!DOCTYPE html>');
    });

    test('GET API non-existent route does not serve index.html (calls next)', async () => {
        const res = await request(app).get('/api/some-non-existent-api-endpoint');
        expect(res.statusCode).toBe(404);
    });

    // 2. Middleware error branches (authMiddleware.js coverage)
    test('GET /api/auth/profile with expired token returns 401', async () => {
        const res = await request(app)
            .get('/api/auth/profile')
            .set('Authorization', `Bearer ${expiredToken}`);
        expect(res.statusCode).toBe(401);
        expect(res.body.error).toContain('Token expired');
    });

    test('GET /api/auth/profile with invalid token signature returns 401', async () => {
        const res = await request(app)
            .get('/api/auth/profile')
            .set('Authorization', `Bearer ${invalidToken}`);
        expect(res.statusCode).toBe(401);
        expect(res.body.error).toContain('Invalid token');
    });

    // 3. AuthController edge cases
    test('POST /api/auth/login with non-existent email returns 401', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'notfound@example.com', password: 'password' });
        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBe('Invalid credentials');
    });

    // 4. Admin statistics caching hit branch
    test('GET /api/admin/stats twice triggers cache hit', async () => {
        // First request - populates cache
        const res1 = await request(app)
            .get('/api/admin/stats')
            .set('Authorization', `Bearer ${token}`);
        expect(res1.statusCode).toBe(200);

        // Modify users list (mockUsers) directly. If cache is hit, the new changes shouldn't show up.
        mockUsers.push({ id: 'user2', email: 'new@example.com', name: 'New', score: 100, footprintHistory: [], completedChallenges: [] });

        // Second request - should hit cache
        const res2 = await request(app)
            .get('/api/admin/stats')
            .set('Authorization', `Bearer ${token}`);
        expect(res2.statusCode).toBe(200);
        expect(res2.body.totalUsers).toBe(1); // Still 1 user from cached stats
    });

    // 5. Direct controller error catching blocks (mocking filesystem throws)
    test('Controllers catch internal filesystem errors gracefully', async () => {
        const req = {
            body: { name: 'Name', email: 'email@example.com', password: 'pwd', challengeId: 'c1', title: 'T', description: 'D', points: '10', type: 'daily' },
            user: { userId: 'user1' }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        // Make readJSON/readFile throw error
        fs.promises.readFile.mockRejectedValue(new Error('Simulated disk error'));

        // authController.register
        await authController.register(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });

        // authController.login
        res.status.mockClear();
        await authController.login(req, res);
        expect(res.status).toHaveBeenCalledWith(500);

        // authController.getProfile
        res.status.mockClear();
        await authController.getProfile(req, res);
        expect(res.status).toHaveBeenCalledWith(500);

        // calculatorController.calculate
        res.status.mockClear();
        await calculatorController.calculate(req, res);
        expect(res.status).toHaveBeenCalledWith(500);

        // challengeController.getAllChallenges
        res.status.mockClear();
        await challengeController.getAllChallenges(req, res);
        expect(res.status).toHaveBeenCalledWith(500);

        // challengeController.completeChallenge
        res.status.mockClear();
        await challengeController.completeChallenge(req, res);
        expect(res.status).toHaveBeenCalledWith(500);

        // adminController.getStats
        res.status.mockClear();
        adminController.invalidateAdminStatsCache();
        await adminController.getStats(req, res);
        expect(res.status).toHaveBeenCalledWith(500);

        // adminController.addChallenge
        res.status.mockClear();
        await adminController.addChallenge(req, res);
        expect(res.status).toHaveBeenCalledWith(500);

        // leaderboardController.getLeaderboard
        res.status.mockClear();
        leaderboardController.invalidateCache();
        await leaderboardController.getLeaderboard(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
    });

    test('authController.register controller check for missing body fields', async () => {
        const req = {
            body: { email: 'email@example.com' } // missing name and password
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await authController.register(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Please provide all required fields' });
    });
});
