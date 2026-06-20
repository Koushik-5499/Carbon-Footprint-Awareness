module.exports = {
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      lines: 60
    }
  },
  moduleNameMapper: {
    '^uuid$': '<rootDir>/tests/__mocks__/uuid.js'
  }
};
