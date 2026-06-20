process.env.PORT = 0;
const calculatorController = require('../backend/controllers/calculatorController');
const fs = require('fs');
const actualFs = jest.requireActual('fs');

jest.mock('fs', () => ({
    ...jest.requireActual('fs'),
    promises: {
        readFile: jest.fn(),
        writeFile: jest.fn()
    }
}));

describe('Calculator Controller Emission Factors', () => {
    let req, res, mockUsers;

    beforeEach(() => {
        mockUsers = [{
            id: 'user123',
            score: 0,
            footprintHistory: []
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

        req = {
            user: { userId: 'user123' },
            body: {}
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('Test transport factor individually (factor: 0.21)', async () => {
        req.body = { transport: 100 };
        await calculatorController.calculate(req, res);
        
        const responseArgs = res.json.mock.calls[0][0];
        expect(responseArgs.record.emissions.transport).toBe(21); // 100 * 0.21
    });

    test('Test electricity factor individually (factor: 0.82)', async () => {
        req.body = { electricity: 100 };
        await calculatorController.calculate(req, res);
        
        const responseArgs = res.json.mock.calls[0][0];
        expect(responseArgs.record.emissions.electricity).toBe(82); // 100 * 0.82
    });

    test('Test water factor individually (factor: 0.0015)', async () => {
        req.body = { water: 1000 };
        await calculatorController.calculate(req, res);
        
        const responseArgs = res.json.mock.calls[0][0];
        expect(responseArgs.record.emissions.water).toBe(1.5); // 1000 * 0.0015
    });

    test('Test gas factor individually (factor: 1.5)', async () => {
        req.body = { gas: 10 };
        await calculatorController.calculate(req, res);
        
        const responseArgs = res.json.mock.calls[0][0];
        expect(responseArgs.record.emissions.gas).toBe(15); // 10 * 1.5
    });

    test('Test waste factor individually (factor: 0.5)', async () => {
        req.body = { waste: 20 };
        await calculatorController.calculate(req, res);
        
        const responseArgs = res.json.mock.calls[0][0];
        expect(responseArgs.record.emissions.waste).toBe(10); // 20 * 0.5
    });

    test('Test total calculation with multiple inputs', async () => {
        req.body = {
            transport: 100, // 21
            electricity: 50, // 41
            water: 2000, // 3
            gas: 5, // 7.5
            waste: 10 // 5
        };
        await calculatorController.calculate(req, res);
        
        const responseArgs = res.json.mock.calls[0][0];
        expect(responseArgs.record.total).toBe(21 + 41 + 3 + 7.5 + 5);
    });

    test('Test zero/missing inputs handled gracefully', async () => {
        req.body = { transport: 0 }; // Only one input, others missing
        await calculatorController.calculate(req, res);
        
        const responseArgs = res.json.mock.calls[0][0];
        expect(responseArgs.record.emissions.electricity).toBe(0);
        expect(responseArgs.record.emissions.water).toBe(0);
        expect(responseArgs.record.emissions.gas).toBe(0);
        expect(responseArgs.record.emissions.waste).toBe(0);
        expect(responseArgs.record.total).toBe(0);
    });

    test('Test negative input handling', async () => {
        req.body = { transport: -100 };
        await calculatorController.calculate(req, res);
        
        const responseArgs = res.json.mock.calls[0][0];
        expect(res.status.mock.calls[0][0]).toBe(400);
        expect(responseArgs.error).toContain('non-negative');
    });

    test('Test that comparedToAverage and treesEquivalent are in the response', async () => {
        req.body = { transport: 10 }; // 2.1 kg
        await calculatorController.calculate(req, res);
        
        const responseArgs = res.json.mock.calls[0][0];
        expect(responseArgs.comparedToAverage).toBeDefined();
        expect(responseArgs.treesEquivalent).toBeDefined();
        expect(responseArgs.comparedToAverage).toBe(Number((2.1 - 4000/365).toFixed(4)));
        expect(responseArgs.treesEquivalent).toBe(Number((2.1 / 21).toFixed(4)));
    });

    test('Test that score increases after calculation', async () => {
        req.body = { transport: 10 };
        await calculatorController.calculate(req, res);
        
        const responseArgs = res.json.mock.calls[0][0];
        expect(responseArgs.newScore).toBeGreaterThan(0);
        expect(mockUsers[0].score).toBeGreaterThan(0);
    });

    test('Test that low footprint (<10 kg) gives more score points than high footprint', async () => {
        req.body = { transport: 2 }; // 2 * 0.21 = 0.42 kg (low footprint)
        await calculatorController.calculate(req, res);
        const lowScore = mockUsers[0].score;

        mockUsers[0].score = 0;
        res.json.mockClear();
        req.body = { transport: 200 }; // 200 * 0.21 = 42 kg (high footprint)
        await calculatorController.calculate(req, res);
        const highScore = mockUsers[0].score;

        expect(lowScore).toBeGreaterThan(highScore);
    });
});
