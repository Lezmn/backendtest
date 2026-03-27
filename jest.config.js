module.exports = {
  testEnvironment: 'node',
  rootDir: './',
  testMatch: ['**/test/**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js'],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  "testEnvironment": "node",
  "testTimeout": 15000,
  "setupFiles": ["dotenv/config"],
  "testEnvironmentOptions": {
    "env": {
      "NODE_ENV": "test"
    }
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
