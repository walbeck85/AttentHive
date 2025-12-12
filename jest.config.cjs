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
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  collectCoverageFrom: [
    'src/app/api/**/*.ts',
    'src/components/**/*.tsx',
    'src/lib/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/__tests__/**',
    '!**/*.test.ts',
    '!**/*.test.tsx',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 10,
      functions: 10,
      lines: 10,
      statements: 10,
    },
  },
};

module.exports = createJestConfig(customJestConfig);