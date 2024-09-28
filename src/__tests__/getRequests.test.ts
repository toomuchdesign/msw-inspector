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
  describe('URL origin with or without trailing slash', () => {
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

  describe('URL with port', () => {
    it('returns requests', async () => {
      const url = 'http://origin.com:1234/path/param';
      await fetch(url);
      expect(await mswInspector.getRequests(url)).toHaveBeenCalledTimes(1);
    });
  });

  describe('multiple matching calls', () => {
    it('preserves calls order', async () => {
      await fetch('http://origin.com', { headers: { id: 'first' } });
      await fetch('http://origin.com', { headers: { id: 'second' } });
      await fetch('http://origin.com', { headers: { id: 'third' } });

      const matchingCalls = await mswInspector.getRequests('http://origin.com');
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

  describe('String urls', () => {
    describe('multiple :namedParams', () => {
      it('find matching request', async () => {
        await fetch('http://origin.com/path/param');
        expect(
          await mswInspector.getRequests('http://origin.com/:param1/:param2'),
        ).toHaveBeenCalledTimes(1);
      });
    });

    describe('less :namedParams then actual paths segments', () => {
      it('throws expected error', async () => {
        await fetch('http://origin.com/path/param');
        expect(
          mswInspector.getRequests('http://origin.com/:param1/'),
        ).rejects.toThrowError(
          '[msw-inspector] Cannot find a matching requests for url: http://origin.com/:param1/. Intercepted requests paths are:\n\nhttp://origin.com',
        );
      });
    });

    describe('wildcard (.*)', () => {
      it('find matching request', async () => {
        await fetch('http://origin.com/path/param');
        expect(
          await mswInspector.getRequests('http://origin.com/*'),
        ).toHaveBeenCalledTimes(1);
      });
    });

    describe('malformed url provided', () => {
      it('throws invalid url error', async () => {
        await fetch('http://origin.com/path/param');
        expect(mswInspector.getRequests('invalid-path')).rejects.toThrowError(
          '[msw-inspector] Provided url is invalid: invalid-path. Intercepted requests paths are:\n\nhttp://origin.com',
        );
      });
    });
  });

  describe('RegExp urls', () => {
    it('find matching request', async () => {
      await fetch('http://origin.com/path/param?query=value');
      expect(
        await mswInspector.getRequests(/.+\?query=.+/),
      ).toHaveBeenCalledTimes(1);
    });

    describe('non-matching regex', () => {
      it('throws expected error', async () => {
        await fetch('http://origin.com/path/param?query=value');
        expect(
          mswInspector.getRequests(/.+\?non-matching=.+/),
        ).rejects.toThrowError(
          '[msw-inspector] Cannot find a matching requests for url: /.+\\?non-matching=.+/. Intercepted requests paths are:\n\nhttp://origin.com/path/param?query=value',
        );
      });
    });
  });

  describe('requesting a url never called', () => {
    it('throws debug error', async () => {
      await fetch('http://origin.com/path/param');
      expect(
        mswInspector.getRequests('http://it.was.never.called'),
      ).rejects.toThrowError(
        '[msw-inspector] Cannot find a matching requests for url: http://it.was.never.called. Intercepted requests paths are:\n\nhttp://origin.com',
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
      it('throws expected error', async () => {
        await fetch('https://api.github.com/repos/toomuchdesign/msw-inspector');
        expect(
          mswInspector.getRequests(
            'https://api.github.com/repos/toomuchdesign/msw-inspector',
          ),
        ).rejects.toThrowError(
          '[msw-inspector] Cannot find a matching requests for url: https://api.github.com/repos/toomuchdesign/msw-inspector.',
        );
      });
    });
  }

  it('returns expected mock type', async () => {
    await fetch('http://origin.com');

    const actual: Mock<any> =
      await mswInspector.getRequests('http://origin.com');

    expect(actual).toBeTypeOf('function');
  });
});
