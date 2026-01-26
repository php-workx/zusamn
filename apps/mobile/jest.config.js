module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/src/__tests__/**/*.test.ts?(x)'],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
};
