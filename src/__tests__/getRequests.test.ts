import {
  beforeAll,
  beforeEach,
  afterAll,
  describe,
  expect,
  it,
  vi,
  Mock,
} from 'vitest';
import { createMSWInspector } from '../index';
import { server } from './__mocks__/server';

const mswInspector = createMSWInspector({
  mockSetup: server,
  mockFactory: () => vi.fn(),
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

    describe('multiple matching calls', () => {
      it('preserves calls order', async () => {
        await fetch('http://origin.com', { headers: { id: 'first' } });
        await fetch('http://origin.com', { headers: { id: 'second' } });
        await fetch('http://origin.com', { headers: { id: 'third' } });

        const matchingCalls =
          await mswInspector.getRequests('http://origin.com');
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
        await fetch(path);
        expect(await mswInspector.getRequests(path)).toHaveBeenCalledTimes(1);
      });
    });

    describe('matching patterns', () => {
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
          expect(
            mswInspector.getRequests('http://origin.com/:param1/'),
          ).rejects.toThrowError(
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
    });

    describe('invalid url provided', () => {
      it('throw invalid url error', async () => {
        await fetch('http://origin.com/path/param');
        expect(mswInspector.getRequests('invalid-path')).rejects.toThrowError(
          '[msw-inspector] Provided path is invalid: invalid-path. Intercepted requests paths are:\n\nhttp://origin.com',
        );
      });
    });

    describe('requesting a url never called', () => {
      it('throw debug error', async () => {
        await fetch('http://origin.com/path/param');
        expect(
          mswInspector.getRequests('http://it.was.never.called'),
        ).rejects.toThrowError(
          '[msw-inspector] Cannot find a matching requests for path: http://it.was.never.called. Intercepted requests paths are:\n\nhttp://origin.com',
        );
      });

      describe('"debug" option === false', () => {
        it('returns empty mock', async () => {
          await fetch('http://origin.com/path/param');
          expect(
            await mswInspector.getRequests('http://it.was.never.called', {
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
          await fetch(
            'https://api.github.com/repos/toomuchdesign/msw-inspector',
          );
          expect(
            mswInspector.getRequests(
              'https://api.github.com/repos/toomuchdesign/msw-inspector',
            ),
          ).rejects.toThrowError(
            '[msw-inspector] Cannot find a matching requests for path: https://api.github.com/repos/toomuchdesign/msw-inspector.',
          );
        });
      });
    }
  });

  it('returns expected mock type', async () => {
    await fetch('http://origin.com');

    const actual: Mock<any, any> =
      await mswInspector.getRequests('http://origin.com');

    expect(actual).toBeTypeOf('function');
  });
});
