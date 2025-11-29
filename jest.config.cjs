/* eslint-disable @typescript-eslint/no-require-imports */

// jest.config.cjs
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './', // root of the Next.js app
});

const customJestConfig = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};

module.exports = createJestConfig(customJestConfig);