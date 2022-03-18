# MSW inspector

## How to

```js
import { createMSWInspector } from 'msw-inspector';
import { server } from '@/mocks/server';
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

describe('My test', () => {
  it('My test', async () => {
    // Perform your test preparation

    expect(
      mswInspector.getCalls(`/expected/network/request/path`)
    ).toHaveBeenCalledWith({
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
