import {
  beforeAll,
  beforeEach,
  afterAll,
  describe,
  expect,
  it,
  vi,
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
      await fetch(`http://origin.com/path/param`, {
        method: 'POST',
        body,
      });

      expect(
        await mswInspector.getRequests('http://origin.com/path/param'),
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

      await fetch(
        `http://origin.com/path/param?${queryString.string}&${queryString.array}&${queryString.object}`,
        {
          method: 'POST',
        },
      );

      expect(
        await mswInspector.getRequests('http://origin.com/path/param'),
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

  describe('non-json response', () => {
    it('returns expected call', async () => {
      await fetch('http://origin.com/non-json-response');

      expect(
        await mswInspector.getRequests('http://origin.com/non-json-response'),
      ).toHaveBeenCalledWith({
        method: 'GET',
        headers: {},
      });
    });
  });

  describe('headers', () => {
    it('returns expected header object', async () => {
      const headers = {
        header1: 'header-1',
        header2: 'header-2',
      };
      await fetch(`http://origin.com/path/param`, {
        method: 'POST',
        headers,
      });

      expect(
        await mswInspector.getRequests('http://origin.com/path/param'),
      ).toHaveBeenCalledWith({
        method: 'POST',
        headers,
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

  describe('no matching calls', () => {
    it('throw expected error', async () => {
      await fetch('http://origin.com/path/param');
      expect(
        mswInspector.getRequests('http://it.was.never.called/'),
      ).rejects.toThrowError(
        '[msw-inspector] Cannot find a matching requests for path: http://it.was.never.called/. Intercepted requests paths are:\n\nhttp://origin.com',
      );
    });
  });

  describe('body already used by MSW handler', () => {
    it('throw expected error', async () => {
      await fetch('http://origin.com/used-body', {
        method: 'POST',
        body: JSON.stringify({ hello: 'world' }),
      });

      expect(
        mswInspector.getRequests('http://origin.com/used-body'),
      ).rejects.toThrowError(
        '[msw-inspector] request.body already read. Make sure your msw handlers clone the request with "request.clone()" before they read the body.',
      );
    });
  });
});
