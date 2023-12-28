import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    setupFiles: ['vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src'],
      enabled: true,
      reporter: [['lcov', { projectRoot: './' }], ['text']],
    },
  },
});
