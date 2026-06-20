const EMISSION_FACTORS = {
    transport: 0.21, // per km (average car)
    electricity: 0.82, // per kWh
    water: 0.0015, // per liter
    gas: 1.5, // per kg
    waste: 0.5 // per kg
};

const JWT_EXPIRY = '7d';

module.exports = {
    EMISSION_FACTORS,
    JWT_EXPIRY
};
