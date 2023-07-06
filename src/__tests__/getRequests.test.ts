import { rest } from 'msw';
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
        await fetch('http://origin.com');
        expect(
          await mswInspector.getRequests('http://origin.com'),
        ).toHaveBeenCalledTimes(1);
        expect(
          await mswInspector.getRequests('http://origin.com/'),
        ).toHaveBeenCalledTimes(1);
      });
    });

    describe('url with port', () => {
      it('returns requests', async () => {
        const path = 'http://origin.com:1234/path/param';
        await fetch(path);
        expect(await mswInspector.getRequests(path)).toHaveBeenCalledTimes(1);
      });
    });

    describe('invalid url provided', () => {
      it('throw invalid url error', async () => {
        await fetch('http://origin.com/path/param');
        await expect(mswInspector.getRequests('invalid-path')).rejects.toThrow(
          '[msw-inspector] Provided path is invalid: invalid-path. Intercepted requests paths are:\n\nhttp://origin.com',
        );
      });
    });

    describe('multiple :namedParams', () => {
      it('find matching request', async () => {
        await fetch('http://origin.com/path/param');
        expect(
          await mswInspector.getRequests('http://origin.com/:param1/:param2'),
        ).toHaveBeenCalledTimes(1);
      });
    });

    describe('less :namedParams then actual paths segments', () => {
      it('throw expected error', async () => {
        await fetch('http://origin.com/path/param');
        await expect(
          mswInspector.getRequests('http://origin.com/:param1/'),
        ).rejects.toThrow(
          '[msw-inspector] Cannot find a matching requests for path: http://origin.com/:param1/. Intercepted requests paths are:\n\nhttp://origin.com',
        );
      });
    });

    describe('wildcard (.*)', () => {
      it('find matching request', async () => {
        await fetch('http://origin.com/path/param');
        expect(
          await mswInspector.getRequests('http://origin.com/(.*)'),
        ).toHaveBeenCalledTimes(1);
      });
    });

    describe('no matching calls', () => {
      describe('requesting a url never called', () => {
        it('throw expected error', async () => {
          await fetch('http://origin.com/path/param');
          await expect(
            mswInspector.getRequests('http://it.was.never.called'),
          ).rejects.toThrow(
            '[msw-inspector] Cannot find a matching requests for path: http://it.was.never.called. Intercepted requests paths are:\n\nhttp://origin.com',
          );
        });
      });

      // @NOTE SKipping locally since it involves external network requests
      if (process.env.CI) {
        describe('calling and requesting a url not registered as MSW handler', () => {
          it('throw expected error', async () => {
            await fetch(
              'https://api.github.com/repos/toomuchdesign/msw-inspector',
            );
            await expect(
              mswInspector.getRequests(
                'https://api.github.com/repos/toomuchdesign/msw-inspector',
              ),
            ).rejects.toThrow(
              '[msw-inspector] Cannot find a matching requests for path: https://api.github.com/repos/toomuchdesign/msw-inspector.',
            );
          });
        });
      }
    });
  });
});
