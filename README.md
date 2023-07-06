# MSW inspector

[![Build status][ci-badge]][ci]
[![Npm version][npm-version-badge]][npm]
[![Test coverage report][coveralls-badge]][coveralls]

Plug-and-play **request assertion** utility for any [`msw`][msw] mock setup, as [highly discouraged][msw-docs-request-assertions] by `msw` authors :)

## Why?

From [`msw` docs][msw-docs-request-assertions]:

> Instead of asserting that a request was made, or had the correct data, test how your application reacted to that request.

> There are, however, some special cases where asserting on network requests is the only option. These include, for example, polling, where no other side effect can be asserted upon.

MSW inspector has you covered for these special cases.

## How

MSW inspector provides a thin layer of logic over [msw life-cycle events][msw-docs-life-cycle-events].

Each request is saved as a **function mock call** retrievable by URL. This allows elegant assertions against request information like `method`, `headers`, `body`, `query`.

## Installation

```
npm install msw-inspector -D
```

## Example

This example uses Jest, but MSW inspector integrates with **any testing framework**.

```js
import { jest } from '@jest/globals';
import { createMSWInspector } from 'msw-inspector';
import { server } from './your-msw-server';

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
    // Perform your tests

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
      },
    );
  });
});
```

## API

### `createMSWInspector`

Create a `MSW inspector` instance bound to a specific `msw` [SetupServer][msw-docs-setup-server] or [SetupWorker][msw-docs-setup-worker] instance:

```ts
import { createMSWInspector } from 'msw-inspector';

createMSWInspector({
  mockSetup, // Any `msw` SetupServer or SetupWorker instance
  mockFactory, // Function returning a mocked function instance to be inspected in your tests
  requestMapper, // Optional mapper function to customize how requests are stored
});
```

#### Options object

`createMSWInspector` accepts the following options object:

```ts
 {
  mockSetup: SetupServer | SetupWorker;
  mockFactory: () => FunctionMock;
  requestMapper?: (req: MockedRequest) => Promise<{
    key: string;
    record: Record<string, any>;
  }>;
}
```

| Option                       | Description                                                                                                                                                                         | Default value                           |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| **mockSetup** _(required)_   | The instance of `msw` mocks expected to inspect _([`setupWorker`][msw-docs-setup-worker] or [`setupServer`][msw-docs-setup-server] result)_                                         | -                                       |
| **mockFactory** _(required)_ | A function returning the function mock preferred by your testing framework: It can be `() => jest.fn()` for Jest, `() => sinon.spy()` for Sinon, `() => vi.fn()` for Vitest, etc... | -                                       |
| **requestMapper**            | Customize default request's key and record mapping with your own logic. Async function.                                                                                             | See [`requestMapper`](src/index.ts#L15) |

### `getRequests`

Returns a mocked function containing all the calls intercepted at the given absolute url (by default):

```ts
mswInspector.getRequests('http://my.url/path');
```

By default each intercepted request calls the matching mocked function with the following request log record:

```ts
type DefaultRequestLogRecord = {
  method: string;
  headers: Record<string, string>;
  body?: any;
  query?: Record<string, string>;
};
```

If you want to create a different log record you can do so by providing a custom `requestMapper`:

```ts
import { createMSWInspector, defaultRequestMapper } from 'msw-inspector';

const mswInspector = createMSWInspector({
  requestMapper: async (req) => {
    // Optionally use the default request mapper to get the default request object
    const defaultLog = await defaultRequestMapper(req);

    return {
      key: pathname,
      record: {
        myMethodProp: req.method,
        myBodyProp: defaultLog.record.body,
      },
    };
  },
});
```

## Todo

- Consider a better name for `getRequests`
- Consider listening to network layer with [`@mswjs/interceptors`](https://github.com/mswjs/interceptors) and make MSW inspector usable in non-`msw` projects
- Todo find out why `SetupServer | SetupWorker` union causes a type error in lifecycle events

[ci-badge]: https://github.com/toomuchdesign/msw-inspector/actions/workflows/ci.yml/badge.svg
[ci]: https://github.com/toomuchdesign/msw-inspector/actions/workflows/ci.yml
[coveralls-badge]: https://coveralls.io/repos/github/toomuchdesign/msw-inspector/badge.svg?branch=master
[coveralls]: https://coveralls.io/github/toomuchdesign/msw-inspector?branch=master
[npm]: https://www.npmjs.com/package/msw-inspector
[npm-version-badge]: https://img.shields.io/npm/v/msw-inspector.svg
[msw]: https://mswjs.io
[msw-docs-life-cycle-events]: https://mswjs.io/docs/extensions/life-cycle-events
[msw-docs-request-assertions]: https://mswjs.io/docs/recipes/request-assertions
[msw-docs-setup-server]: https://mswjs.io/docs/api/setup-server
[msw-docs-setup-worker]: https://mswjs.io/docs/api/setup-worker
