import { defineConfig } from "vitest/config";

/**
 * Vitest configuration for emulator/integration tests.
 * These tests require the Firebase emulator to be running.
 *
 * To run: pnpm test:emulator
 * Requires: firebase emulators:start
 */
export default defineConfig({
  test: {
    environment: "node",
    include: [
      "**/*.emulator.test.ts",
      "**/*.emulator.test.tsx",
      "**/*.integration.test.ts",
      "**/*.integration.test.tsx",
    ],
    exclude: ["**/node_modules/**"],
    testTimeout: 60000,
    hookTimeout: 60000,
    // Run sequentially - emulator tests can conflict
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
