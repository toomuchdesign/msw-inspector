import fetch from 'node-fetch';
import { createMSWInspector } from '../index';
import { server } from './__mocks__/server';

const mswInspector = createMSWInspector({
  server,
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

describe('msw inspector', () => {
  it('intercepts calls', async () => {
    await fetch('http://test.com/foo');

    expect(mswInspector.getCalls('/foo')).toHaveBeenCalledWith({
      method: 'GET',
      headers: {
        accept: '*/*',
        'accept-encoding': 'gzip,deflate',
        connection: 'close',
        host: 'test.com',
        'user-agent': 'node-fetch/1.0 (+https://github.com/bitinn/node-fetch)',
      },
    });
  });
});
