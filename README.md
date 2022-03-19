# MSW inspector

## How to (with Jest)

```js
import { createMSWInspector } from 'msw-inspector';
import { server } from '@/mocks/server';

const mswInspector = createMSWInspector({
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

describe('My test', () => {
  it('My test', async () => {
    // Perform your test preparation

    expect(mswInspector.getCalls('http://my.url/path')).toHaveBeenCalledWith({
      method: 'GET',
      headers: {
        'my-header': 'value',
      },
      body: {
        'my-body': 'value',
      },
      query: {
        'my-query': 'value',
      },
    });
  });
});
```
