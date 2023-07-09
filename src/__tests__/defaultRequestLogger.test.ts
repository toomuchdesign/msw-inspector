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

describe('default request logger', () => {
  describe.each([
    {
      body: JSON.stringify({ hello: 'world' }),
      expectedBody: { hello: 'world' },
      type: 'json',
    },
    { body: 'Plain text', expectedBody: 'Plain text', type: 'text' },
  ])('body as $type', ({ body, expectedBody, type }) => {
    it('returns expected body value', async () => {
      // @ts-expect-error fetch not typed in Node18
      await fetch(`http://origin.com/path/param`, {
        method: 'POST',
        body,
      });

      expect(
        mswInspector.getRequests('http://origin.com/path/param'),
      ).toHaveBeenCalledWith({
        method: 'POST',
        headers: {
          'content-type': 'text/plain;charset=UTF-8',
        },
        body: expectedBody,
      });
    });
  });

  describe('complex querystring', () => {
    it('returns expected parsed values', async () => {
      const queryString = {
        string: 'string=value',
        array: 'array[]=value1&array[]=value2',
        object: 'object[prop1]=value1&object[prop2]=value2',
      };

      // @ts-expect-error fetch not typed in Node18
      await fetch(
        `http://origin.com/path/param?${queryString.string}&${queryString.array}&${queryString.object}`,
        {
          method: 'POST',
        },
      );

      expect(
        mswInspector.getRequests('http://origin.com/path/param'),
      ).toHaveBeenCalledWith({
        method: 'POST',
        headers: {},
        query: {
          string: 'value',
          array: ['value1', 'value2'],
          object: {
            prop1: 'value1',
            prop2: 'value2',
          },
        },
      });
    });
  });

  describe('headers', () => {
    it('returns expected header object', async () => {
      const headers = {
        header1: 'header-1',
        header2: 'header-2',
      };
      // @ts-expect-error fetch not typed in Node18
      await fetch(`http://origin.com/path/param`, {
        method: 'POST',
        headers,
      });

      expect(
        mswInspector.getRequests('http://origin.com/path/param'),
      ).toHaveBeenCalledWith({
        method: 'POST',
        headers,
      });
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

describe('no matching calls', () => {
  it('throw expected error', async () => {
    // @ts-expect-error fetch not typed in Node18
    await fetch('http://origin.com/path/param');
    expect(() =>
      mswInspector.getRequests('http://it.was.never.called/'),
    ).toThrow(
      '[msw-inspector] Cannot find a matching requests for path: http://it.was.never.called/. Intercepted requests paths are:\n\nhttp://origin.com',
    );
  });
});
