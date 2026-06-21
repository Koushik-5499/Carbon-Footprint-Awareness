process.env.PORT = 0;
const request = require('supertest');
const fs = require('fs');
const actualFs = jest.requireActual('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

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
            password: bcrypt.hashSync('password123', 10),
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
            .send({ email: 'notfound@example.com', password: 'password', tags: ['array_item_to_cover_line_83'] });
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

    test('GET /api/test-error invokes error handling middleware and returns 400', async () => {
        const res = await request(app).get('/api/test-error');
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('Something went wrong!');
    });

    test('Controllers handle missing users/challenges and trigger edge cases', async () => {
        const req = {
            body: { challengeId: 'non-existent-challenge-id', transport: 10 },
            user: { userId: 'non-existent-user-id' }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        // authController.getProfile with non-existent user
        await authController.getProfile(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });

        // calculatorController.calculate with non-existent user
        res.status.mockClear();
        await calculatorController.calculate(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });

        // challengeController.completeChallenge with non-existent challenge
        res.status.mockClear();
        req.user.userId = 'user1'; // Set back to a valid user in mockUsers
        await challengeController.completeChallenge(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Challenge not found' });

        // challengeController.completeChallenge with non-existent user but valid challenge
        res.status.mockClear();
        req.user.userId = 'non-existent-user-id';
        req.body.challengeId = 'challenge-1';
        await challengeController.completeChallenge(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    test('Auth controller and middleware use fallback secret if process.env.JWT_SECRET is deleted', async () => {
        const oldSecret = process.env.JWT_SECRET;
        delete process.env.JWT_SECRET;

        // authController.register (generates token with fallback secret)
        const reqReg = {
            body: { name: 'Fallback User', email: 'fallback@example.com', password: 'password123' }
        };
        const resReg = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        await authController.register(reqReg, resReg);
        expect(resReg.status).toHaveBeenCalledWith(201);

        const req = {
            body: { email: 'test@example.com', password: 'password123' }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        // authController.login (generates token with fallback secret)
        await authController.login(req, res);
        const token = res.json.mock.calls[0][0].token;
        expect(token).toBeDefined();

        // authMiddleware (verifies token with fallback secret)
        const reqMiddleware = {
            headers: { authorization: `Bearer ${token}` }
        };
        const next = jest.fn();
        const authMiddleware = require('../backend/middleware/authMiddleware');
        authMiddleware(reqMiddleware, res, next);
        expect(next).toHaveBeenCalled();

        process.env.JWT_SECRET = oldSecret;
    });

    test('JWT secret validation check exit simulation', () => {
        const mockExit = jest.spyOn(process, 'exit').mockImplementation((code) => {
            throw new Error(`process.exit called with code ${code}`);
        });
        const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        const oldEnv = process.env.NODE_ENV;
        const oldSecret = process.env.JWT_SECRET;
        
        delete process.env.NODE_ENV;
        process.env.JWT_SECRET = 'your_super_secret_jwt_key_here';
        
        expect(() => {
            jest.isolateModules(() => {
                require('../backend/server');
            });
        }).toThrow('process.exit called with code 1');
        
        expect(mockExit).toHaveBeenCalledWith(1);
        
        process.env.NODE_ENV = oldEnv;
        process.env.JWT_SECRET = oldSecret;
        mockExit.mockRestore();
        mockConsoleError.mockRestore();
    });

    test('Integration validation check for API endpoints', async () => {
        // Calculator validation error
        const resCalc = await request(app)
            .post('/api/calculator')
            .set('Authorization', `Bearer ${token}`)
            .send({ transport: -5 });
        expect(resCalc.statusCode).toBe(400);
        expect(resCalc.body.error).toContain('non-negative');

        // Calculator validation success (covers next() on line 12 of calculatorRoutes.js)
        const resCalcSuccess = await request(app)
            .post('/api/calculator')
            .set('Authorization', `Bearer ${token}`)
            .send({ transport: 10, electricity: 5 });
        expect(resCalcSuccess.statusCode).toBe(201);

        // AI validation error
        const resAI = await request(app)
            .post('/api/ai/ask')
            .set('Authorization', `Bearer ${token}`)
            .send({});
        expect(resAI.statusCode).toBe(400);
        expect(resAI.body.error).toContain('Question is required');

        // Challenge validation error
        const resChallenge = await request(app)
            .post('/api/challenges/complete')
            .set('Authorization', `Bearer ${token}`)
            .send({});
        expect(resChallenge.statusCode).toBe(400);
        expect(resChallenge.body.error).toContain('Challenge ID is required');

        // Admin validation error
        const resAdmin = await request(app)
            .post('/api/admin/challenges')
            .set('Authorization', `Bearer ${token}`)
            .send({});
        expect(resAdmin.statusCode).toBe(400);
        expect(resAdmin.body.error).toBe('All challenge fields are required');
    });

    test('adminController.addChallenge controller direct validation check', async () => {
        const req = {
            body: { title: 'No points' }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        await adminController.addChallenge(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'All challenge fields are required' });
    });
});
