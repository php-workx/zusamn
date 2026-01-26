import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    environmentMatchGlobs: [
      ['tests/use*.test.ts', 'jsdom'],
      ['tests/**/*.test.tsx', 'jsdom'],
    ],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    testTimeout: 30000, // Emulator tests can be slow
    hookTimeout: 30000,
    // Run tests sequentially to avoid race conditions with Firestore emulator
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    sequence: {
      shuffle: false,
      concurrent: false,
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: 'coverage',
    },
  },
});
