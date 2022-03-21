import fetch from 'node-fetch';
import { createMSWInspector } from '../index';
import { server } from './__mocks__/server';

const mswInspector = createMSWInspector({
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
  it('returns a mocked function with mathching intercepted calls for a given path', async () => {
    await fetch('http://absolute.path');

    expect(
      mswInspector.getRequestsTo('http://absolute.path/')
    ).toHaveBeenCalledWith({
      method: 'GET',
      headers: {
        accept: '*/*',
        'accept-encoding': 'gzip,deflate',
        connection: 'close',
        host: 'absolute.path',
        'user-agent': 'node-fetch/1.0 (+https://github.com/bitinn/node-fetch)',
      },
    });
  });

  describe('no matching calls', () => {
    it('throw expected error', async () => {
      await fetch('http://absolute.path');

      expect(() =>
        mswInspector.getRequestsTo('http://it.was.never.called/')
      ).toThrowError(
        '[msw-inspector] Cannot find a matching requests for path: http://it.was.never.called/. Intercepted requests paths are:\n\nhttp://absolute.path'
      );
    });
  });
});
