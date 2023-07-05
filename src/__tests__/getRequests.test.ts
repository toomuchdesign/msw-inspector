import { createMSWInspector, MswInspector } from '../index';
import { server } from './__mocks__/server';

const mswInspector: MswInspector = createMSWInspector({
  mockSetup: server,
  mockFactory: () => jest.fn(),
});

beforeAll(() => {
  mswInspector.setup();
});

beforeEach(() => {
  mswInspector.clear();
});

afterAll(() => {
  mswInspector.teardown();
});

describe('getRequests', () => {
  describe('invalid url provided', () => {
    it('throw invalid url error', async () => {
      await fetch('http://origin.com/path/param');
      await expect(
        mswInspector.getRequests('invalid-path'),
      ).rejects.toThrowError(
        '[msw-inspector] Provided path is invalid: invalid-path. Intercepted requests paths are:\n\nhttp://origin.com',
      );
    });
  });

  describe('no matching calls', () => {
    it('throw expected error', async () => {
      await fetch('http://origin.com/path/param');
      await expect(
        mswInspector.getRequests('http://it.was.never.called/'),
      ).rejects.toThrowError(
        '[msw-inspector] Cannot find a matching requests for path: http://it.was.never.called/. Intercepted requests paths are:\n\nhttp://origin.com',
      );
    });
  });
});
