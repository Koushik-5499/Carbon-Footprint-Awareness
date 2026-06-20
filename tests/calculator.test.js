const calculatorController = require('../backend/controllers/calculatorController');
const fs = require('fs');

jest.mock('fs', () => ({
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
        
        fs.promises.readFile.mockResolvedValue(JSON.stringify(mockUsers));
        fs.promises.writeFile.mockResolvedValue();

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
        // The implementation calculates emission even for negative values
        req.body = { transport: -100 };
        await calculatorController.calculate(req, res);
        
        const responseArgs = res.json.mock.calls[0][0];
        expect(res.status.mock.calls[0][0]).toBe(400); // Wait, this should return 400 now!
        expect(responseArgs.error).toContain('non-negative');
    });
});
