import {
  createMSWInspector,
  defaultRequestMapper,
  MswInspector,
} from '../index';
import { server } from './__mocks__/server';

const mswInspector: MswInspector = createMSWInspector({
  mockSetup: server,
  mockFactory: () => jest.fn(),
  requestMapper: async (req) => {
    const { method } = req;
    const { body } = await defaultRequestMapper(req);

    return {
      method,
      customBodyProp: body,
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
    await fetch('http://origin.com/path/param', {
      method: 'POST',
      body: JSON.stringify({ surname: 'bar' }),
    });

    expect(
      await mswInspector.getRequests('http://origin.com/path/param'),
    ).toHaveBeenCalledWith({
      method: 'POST',
      customBodyProp: { surname: 'bar' },
    });
  });
});
