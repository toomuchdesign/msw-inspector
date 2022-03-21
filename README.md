# MSW inspector

Plug-and-play **request assertion** utility for any [`msw`][msw] mock setup, as [highly discouraged][msw-docs-request-assertions] by `msw` authors :)

## Why?

From [`msw` docs][msw-docs-request-assertions]:

> Instead of asserting that a request was made, or had the correct data, test how your application reacted to that request.

> There are, however, some special cases where asserting on network requests is the only option. These include, for example, polling, where no other side effect can be asserted upon.

MSW inspector has you covered for these special cases.

## How

MSW inspector provides a thin layer of logic over [msw life-cycle events][msw-docs-life-cycle-events].

Each request is saved as a **function mock call** retrievable by URL. This allows elegant assertions against request information like `method`, `headers`, `body`, `query`.

## Example

This example uses Jest, but MSW inspector integrates with **any testing framework**.

```js
import { createMSWInspector } from 'msw-inspector';
import { server } from '@/mocks/server';

const mswInspector = createMSWInspector({
  mockSetup: server,
  mockFactory: () => jest.fn(), // Provide any function mock supported by your testing library
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

    expect(mswInspector.getRequests('http://my.url/path')).toHaveBeenCalledWith(
      {
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
      }
    );
  });
});
```

## API

### `createMSWInspector`

Create a `MSW inspector` instance bound to a specific `msw` [SetupServerApi][msw-docs-setup-server] or [SetupWorkerApi][msw-docs-setup-worker] instance:

```ts
import { createMSWInspector } from 'msw-inspector';

createCachedSelector({
  mockSetup, // Any `msw` SetupServerApi or SetupWorkerApi instance
  mockFactory, // Function returning a mocked function instance to be inspected in your tests
});
```

### `getRequests`

Returns a mocked function containing all the calls intercepted for the given absolute url:

```ts
mswInspector.getRequests('http://my.url/path');
```

Each intercepted request calls the matching mocked function with the following payload:

```ts
type CallPayload = {
  method:
    | 'CONNECT'
    | 'DELETE'
    | 'GET'
    | 'HEAD'
    | 'OPTIONS'
    | 'PATCH'
    | 'POST'
    | 'PUT'
    | 'TRACE';
  headers: Record<string, string>;
  body?: any;
  query?: Record<string, string>;
};
```

## Todo

- Consider a better name for `getRequests`
- Consider listening to network layer with [`@mswjs/interceptors`](https://github.com/mswjs/interceptors) and make MSW inspector usable in non-`msw` projects
- Consider accepting a function to customize requests mapping and payload

[msw]: https://mswjs.io
[msw-docs-life-cycle-events]: https://mswjs.io/docs/extensions/life-cycle-events
[msw-docs-request-assertions]: https://mswjs.io/docs/recipes/request-assertions
[msw-docs-setup-server]: https://mswjs.io/docs/api/setup-server
[msw-docs-setup-worker]: https://mswjs.io/docs/api/setup-worker
