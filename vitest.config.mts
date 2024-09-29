import { defineConfig, defaultInclude } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['vitest.setup.ts'],
    testTimeout: 200,
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
