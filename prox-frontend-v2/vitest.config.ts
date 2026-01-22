import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 90000, // 90s timeout for API calls (Claude API can be slow)
    hookTimeout: 10000,
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    reporters: [
      'verbose',
      ['json', { outputFile: 'tests/results/latest.json' }]
    ],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules', 'tests'],
    },
  },
});
