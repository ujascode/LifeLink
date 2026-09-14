/**
 * Jest configuration for LifeLink Backend
 */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  coverageDirectory: '<rootDir>/coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/_*.js',
    '!src/config/**',
    '!src/server.js',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  verbose: true,
  restoreMocks: true,
  clearMocks: true,
  setupFilesAfterEnv: ['./tests/setup.js'],
  transformIgnorePatterns: [
    '/node_modules/(?!(uuid|mongoose)/)',
  ],
};