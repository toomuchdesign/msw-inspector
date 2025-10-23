import { defineConfig, defaultInclude } from 'vitest/config';

export default defineConfig({
  test: {
    dir: 'test',
    setupFiles: ['vitest.setup.ts'],
    testTimeout: process.env.CI ? 1000 : 200,
    coverage: {
      provider: 'v8',
      include: ['src'],
      enabled: true,
      reporter: [['lcov', { projectRoot: './' }], ['text']],
    },
    typecheck: {
      enabled: true,
      include: defaultInclude,
    },
  },
});
