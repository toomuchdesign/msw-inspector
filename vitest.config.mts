import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    setupFiles: ['vitest.setup.mts'],
    coverage: {
      provider: 'istanbul',
      include: ['src'],
      enabled: true,
      reporter: [['lcov', { projectRoot: './' }], ['text']],
    },
  },
});
