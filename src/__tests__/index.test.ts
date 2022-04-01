import fetch from 'node-fetch';
import { createMSWInspector } from '../index';
import { server } from './__mocks__/server';

describe('getRequests', () => {
  describe('default options', () => {
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

    it('returns a mocked function with matching intercepted calls for a given path', async () => {
      await fetch('http://absolute.path?name=foo', {
        method: 'POST',
        body: JSON.stringify({ surname: 'bar' }),
      });

      expect(
        mswInspector.getRequests('http://absolute.path/')
      ).toHaveBeenCalledWith({
        method: 'POST',
        headers: {
          accept: '*/*',
          'accept-encoding': 'gzip,deflate',
          connection: 'close',
          'content-length': '17',
          'content-type': 'text/plain;charset=UTF-8',
          host: 'absolute.path',
          'user-agent':
            'node-fetch/1.0 (+https://github.com/bitinn/node-fetch)',
        },
        body: JSON.stringify({ surname: 'bar' }),
        query: {
          name: 'foo',
        },
      });
    });

    describe('no matching calls', () => {
      it('throw expected error', async () => {
        await fetch('http://absolute.path');

        expect(() =>
          mswInspector.getRequests('http://it.was.never.called/')
        ).toThrowError(
          '[msw-inspector] Cannot find a matching requests for path: http://it.was.never.called/. Intercepted requests paths are:\n\nhttp://absolute.path'
        );
      });
    });
  });

  describe('requestMapper option', () => {
    const mswInspector = createMSWInspector({
      mockSetup: server,
      mockFactory: () => jest.fn(),
      requestMapper: (req) => {
        const { method } = req;
        const { pathname } = req.url;

        return {
          key: pathname,
          record: {
            method,
          },
        };
      },
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

    it('replaces default mapping behavior', async () => {
      await fetch('http://absolute.path/path-name', {
        method: 'POST',
        body: JSON.stringify({ surname: 'bar' }),
      });

      expect(mswInspector.getRequests('/path-name')).toHaveBeenCalledWith({
        method: 'POST',
      });
    });
  });
});
