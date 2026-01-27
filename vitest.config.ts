import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: [resolve(__dirname, 'vitest.setup.ts')],
    include: [
      '**/src/**/*.test.ts',
      '**/src/**/*.test.tsx',
      '**/tests/**/*.test.ts',
      '**/tests/**/*.test.tsx',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      // Exclude emulator/integration tests - they require Firebase emulator
      '**/*.emulator.test.ts',
      '**/*.emulator.test.tsx',
      '**/*.integration.test.ts',
      '**/*.integration.test.tsx',
      // Exclude mobile app tests - they use Jest, not Vitest
      'apps/mobile/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      reportsDirectory: 'coverage',
      include: ['**/src/**/*.ts', '**/src/**/*.tsx'],
      exclude: [
        '**/node_modules/**',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
        '**/types/**',
        '**/*.d.ts',
      ],
      // Coverage thresholds - start low and ratchet up over time
      // Current state: ~11% lines, ~32% branches, ~21% functions
      // Target: 80% lines, 70% branches, 75% functions
      thresholds: {
        lines: 10, // TODO: Increase to 80% as tests are added
        branches: 30, // TODO: Increase to 70% as tests are added
        functions: 20, // TODO: Increase to 75% as tests are added
        statements: 10, // TODO: Increase to 80% as tests are added
      },
    },
  },
});
