import { createMSWInspector } from '../index';
import { server } from './__mocks__/server';

describe('getRequests', () => {
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

  describe.each([
    {
      body: JSON.stringify({ hello: 'world' }),
      expectedBody: { hello: 'world' },
      type: 'json',
    },
    { body: 'Plain text', expectedBody: 'Plain text', type: 'text' },
  ])('body as $type', ({ body, expectedBody, type }) => {
    it('returns a mocked function with matching intercepted calls for a given path', async () => {
      await fetch('http://absolute.path?myQueryString=foo', {
        method: 'POST',
        headers: {
          myHeader: 'foo',
        },
        body,
      });

      expect(
        mswInspector.getRequests('http://absolute.path/')
      ).toHaveBeenCalledWith({
        method: 'POST',
        headers: {
          myheader: 'foo',
          'content-type': 'text/plain;charset=UTF-8',
        },
        body: expectedBody,
        query: {
          myQueryString: 'foo',
        },
      });
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

  describe('requestMapper option', () => {
    const mswInspector = createMSWInspector({
      mockSetup: server,
      mockFactory: () => jest.fn(),
      requestMapper: async (req) => {
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
