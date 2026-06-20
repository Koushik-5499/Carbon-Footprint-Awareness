process.env.PORT = 0;
const request = require('supertest');
const fs = require('fs');
const actualFs = jest.requireActual('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

jest.mock('fs', () => ({
    ...jest.requireActual('fs'),
    promises: {
        readFile: jest.fn(),
        writeFile: jest.fn()
    }
}));

const app = require('../backend/server');

describe('Auth Integration Tests', () => {
    let mockUsers;

    beforeEach(() => {
        mockUsers = [{
            id: 'user1',
            email: 'test@example.com',
            password: bcrypt.hashSync('password123', 10),
            name: 'Test User',
            score: 0,
            footprintHistory: [],
            completedChallenges: []
        }];

        fs.promises.readFile.mockImplementation(async (filePath, options) => {
            if (typeof filePath === 'string' && filePath.includes('users.json')) {
                return JSON.stringify(mockUsers);
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
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('POST /api/auth/register returns 201 + token', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'New User',
                email: 'new@example.com',
                password: 'newpassword'
            });
        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user.email).toBe('new@example.com');
    });

    test('POST /api/auth/register rejects duplicate email', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Another User',
                email: 'test@example.com', // Already exists in mockUsers
                password: 'password123'
            });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('User already exists');
    });

    test('POST /api/auth/register rejects missing fields', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'missing@example.com'
                // missing name and password
            });
        expect(res.statusCode).toBe(400);
        expect(res.body.errors).toBeDefined();
    });

    test('POST /api/auth/login returns 200 + token with valid credentials', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'password123'
            });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user.email).toBe('test@example.com');
    });

    test('POST /api/auth/login returns 401 with wrong password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'wrongpassword'
            });
        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBe('Invalid credentials');
    });

    test('GET /api/auth/profile returns 401 without token', async () => {
        const res = await request(app)
            .get('/api/auth/profile');
        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBe('Unauthorized: No token provided');
    });

    test('GET /api/auth/profile returns user data with valid token', async () => {
        // First login to get token
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'password123'
            });
        const token = loginRes.body.token;

        // Fetch profile
        const res = await request(app)
            .get('/api/auth/profile')
            .set('Authorization', `Bearer ${token}`);
            
        expect(res.statusCode).toBe(200);
        expect(res.body.email).toBe('test@example.com');
        expect(res.body.name).toBe('Test User');
        expect(res.body.password).toBeUndefined(); // Should not send password
    });
});
