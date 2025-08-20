const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Chemin vers l'app Next.js
  dir: './',
})

// Configuration Jest personnalisée
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/tests/e2e/', // Ignorer tests Playwright
  ],
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
  moduleNameMapper: {
    // Alias pour les chemins absolus (pattern unifié)
    '^@/(.*)$': '<rootDir>/$1',
    // Gérer les imports CSS/SCSS
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  testMatch: ['**/__tests__/**/*.(js|jsx|ts|tsx)', '**/*.(test|spec).(js|jsx|ts|tsx)'],
  transformIgnorePatterns: ['/node_modules/(?!(jose|openid-client|next-auth|@next|@sentry)/)'],
}

// Exporter la configuration avec Next.js
module.exports = createJestConfig(customJestConfig)
