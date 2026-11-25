import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['apps/api/tests/**/*.test.ts', 'apps/web/src/**/*.test.tsx'],
    setupFiles: ['apps/api/tests/setup.ts'],
    // These tests share one database and two user accounts; parallel files
    // would let cleanup and fixtures race each other.
    fileParallelism: false,
    testTimeout: 30_000,
  },
})
