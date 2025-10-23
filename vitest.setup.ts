import { beforeAll, afterAll, afterEach } from 'vitest';
import { server } from './test/mocks/server';

// https://mswjs.io/docs/getting-started/integrate/node
// Establish API mocking before all tests.
beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'warn',
  });
});

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => {
  server.resetHandlers();
});

// Clean up after the tests are finished.
afterAll(() => {
  server.close();
});
