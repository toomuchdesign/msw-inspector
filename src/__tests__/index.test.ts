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
  describe.each([
    {
      body: JSON.stringify({ hello: 'world' }),
      expectedBody: { hello: 'world' },
      type: 'json',
    },
    { body: 'Plain text', expectedBody: 'Plain text', type: 'text' },
  ])('body as $type', ({ body, expectedBody, type }) => {
    it('returns a mocked function with matching intercepted calls for a given path', async () => {
      const queryString = {
        string: 'string=value',
        array: 'array[]=value1&array[]=value2',
        object: 'object[prop1]=value1&object[prop2]=value2',
      };

      await fetch(
        `http://absolute.path?${queryString.string}&${queryString.array}&${queryString.object}`,
        {
          method: 'POST',
          headers: {
            myHeader: 'foo',
          },
          body,
        },
      );

      expect(
        mswInspector.getRequests('http://absolute.path/'),
      ).toHaveBeenCalledWith({
        method: 'POST',
        headers: {
          myheader: 'foo',
          'content-type': 'text/plain;charset=UTF-8',
        },
        body: expectedBody,
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

  describe('no matching calls', () => {
    it('throw expected error', async () => {
      await fetch('http://absolute.path');

      expect(() =>
        mswInspector.getRequests('http://it.was.never.called/'),
      ).toThrowError(
        '[msw-inspector] Cannot find a matching requests for path: http://it.was.never.called/. Intercepted requests paths are:\n\nhttp://absolute.path',
      );
    });
  });
});
