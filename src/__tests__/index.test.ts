import fetch from 'node-fetch';
import { createMSWInspector } from '../index';
import { server } from './mocks/server';

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
    await fetch('/get');

    expect(mswInspector.getCalls('/foo')).toHaveBeenCalledWith({
      method: 'GET',
    });
  });
});
