import { createMSWInspector, MswInspector } from '../index';
import { server } from './__mocks__/server';

const mswInspector: MswInspector = createMSWInspector({
  mockSetup: server,
  mockFactory: () => jest.fn(),
  requestMapper: async ({ req, record, key }) => {
    const { method } = req;
    const { pathname } = req.url;
    const { body } = record;

    return {
      key: pathname,
      record: {
        method,
        customBodyProp: body,
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

describe('requestMapper option', () => {
  it('replaces default mapping behavior', async () => {
    await fetch('http://absolute.path/path-name', {
      method: 'POST',
      body: JSON.stringify({ surname: 'bar' }),
    });

    expect(mswInspector.getRequests('/path-name')).toHaveBeenCalledWith({
      method: 'POST',
      customBodyProp: { surname: 'bar' },
    });
  });
});
