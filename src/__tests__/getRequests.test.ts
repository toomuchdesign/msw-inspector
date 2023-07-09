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
  describe('path matching', () => {
    describe('origin with or without trailing slash', () => {
      it('find matching request', async () => {
        // @ts-expect-error fetch not typed in Node18
        await fetch('http://origin.com');
        expect(
          mswInspector.getRequests('http://origin.com'),
        ).toHaveBeenCalledTimes(1);
        expect(
          mswInspector.getRequests('http://origin.com/'),
        ).toHaveBeenCalledTimes(1);
      });
    });

    describe('multiple matching calls', () => {
      it('preserves calls order', async () => {
        // @ts-expect-error fetch not typed in Node18
        await fetch('http://origin.com', { headers: { id: 'first' } });
        // @ts-expect-error fetch not typed in Node18
        await fetch('http://origin.com', { headers: { id: 'second' } });
        // @ts-expect-error fetch not typed in Node18
        await fetch('http://origin.com', { headers: { id: 'third' } });

        const matchingCalls = mswInspector.getRequests('http://origin.com');
        expect(matchingCalls).toHaveBeenCalledTimes(3);

        ['first', 'second', 'third'].forEach((id, index) => {
          expect(matchingCalls).toHaveBeenNthCalledWith(index + 1, {
            method: 'GET',
            headers: {
              id,
            },
          });
        });
      });
    });

    describe('url with port', () => {
      it('returns requests', async () => {
        const path = 'http://origin.com:1234/path/param';
        // @ts-expect-error fetch not typed in Node18
        await fetch(path);
        expect(mswInspector.getRequests(path)).toHaveBeenCalledTimes(1);
      });
    });

    describe('matching patterns', () => {
      describe('multiple :namedParams', () => {
        it('find matching request', async () => {
          // @ts-expect-error fetch not typed in Node18
          await fetch('http://origin.com/path/param');
          expect(
            mswInspector.getRequests('http://origin.com/:param1/:param2'),
          ).toHaveBeenCalledTimes(1);
        });
      });

      describe('less :namedParams then actual paths segments', () => {
        it('throw expected error', async () => {
          // @ts-expect-error fetch not typed in Node18
          await fetch('http://origin.com/path/param');
          expect(() =>
            mswInspector.getRequests('http://origin.com/:param1/'),
          ).toThrow(
            '[msw-inspector] Cannot find a matching requests for path: http://origin.com/:param1/. Intercepted requests paths are:\n\nhttp://origin.com',
          );
        });
      });

      describe('wildcard (.*)', () => {
        it('find matching request', async () => {
          // @ts-expect-error fetch not typed in Node18
          await fetch('http://origin.com/path/param');
          expect(
            mswInspector.getRequests('http://origin.com/(.*)'),
          ).toHaveBeenCalledTimes(1);
        });
      });
    });

    describe('invalid url provided', () => {
      it('throw invalid url error', async () => {
        // @ts-expect-error fetch not typed in Node18
        await fetch('http://origin.com/path/param');
        expect(() => mswInspector.getRequests('invalid-path')).toThrow(
          '[msw-inspector] Provided path is invalid: invalid-path. Intercepted requests paths are:\n\nhttp://origin.com',
        );
      });
    });

    describe('requesting a url never called', () => {
      it('throw debug error', async () => {
        // @ts-expect-error fetch not typed in Node18
        await fetch('http://origin.com/path/param');
        expect(() =>
          mswInspector.getRequests('http://it.was.never.called'),
        ).toThrow(
          '[msw-inspector] Cannot find a matching requests for path: http://it.was.never.called. Intercepted requests paths are:\n\nhttp://origin.com',
        );
      });

      describe('"debug" option === false', () => {
        it('returns empty mock', async () => {
          // @ts-expect-error fetch not typed in Node18
          await fetch('http://origin.com/path/param');
          expect(
            mswInspector.getRequests('http://it.was.never.called', {
              debug: false,
            }),
          ).not.toHaveBeenCalled();
        });
      });
    });

    // @NOTE SKipping locally since it involves external network requests
    if (process.env.CI) {
      describe('calling and requesting a url not registered as MSW handler', () => {
        it('throw expected error', async () => {
          // @ts-expect-error fetch not typed in Node18
          await fetch(
            'https://api.github.com/repos/toomuchdesign/msw-inspector',
          );
          expect(() =>
            mswInspector.getRequests(
              'https://api.github.com/repos/toomuchdesign/msw-inspector',
            ),
          ).toThrow(
            '[msw-inspector] Cannot find a matching requests for path: https://api.github.com/repos/toomuchdesign/msw-inspector.',
          );
        });
      });
    }
  });
});
