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

Each request is saved as a **function mock call** retrievable by URL. This allows elegant assertions against request records like `method`, `headers`, `body`, `query` fully integrates with your test assertion library.

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
  requestLogger, // Optional mapper function to customize how request records are stored
});
```

#### `createMSWInspector` Options

`createMSWInspector` accepts the following options object:

```ts
 {
  mockSetup: SetupServer | SetupWorker;
  mockFactory: () => FunctionMock;
  requestLogger?: (req: MockedRequest) => Promise<Record<string, unknown>>;
}
```

| Option                       | Description                                                                                                                                                                         | Default value                           |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| **mockSetup** _(required)_   | The instance of `msw` mocks expected to inspect _([`setupWorker`][msw-docs-setup-worker] or [`setupServer`][msw-docs-setup-server] result)_                                         | -                                       |
| **mockFactory** _(required)_ | A function returning the function mock preferred by your testing framework: It can be `() => jest.fn()` for Jest, `() => sinon.spy()` for Sinon, `() => vi.fn()` for Vitest, etc... | -                                       |
| **requestLogger**            | Customize request records with your own object. Async function.                                                                                                                     | See [`requestLogger`](src/index.ts#L19) |

### `getRequests`

Returns a mocked function pre-called with all the request records whose absolute url match the provided one:

```ts
mswInspector.getRequests('http://my.url/path/:param');
```

The matching url can be provided as plain absolute url string or [path-to-regexp](https://www.npmjs.com/package/path-to-regexp) matching pattern.

By default, each matching request results into a mocked function call with the following request log record:

```ts
type DefaultRequestLogRecord = {
  method: string;
  headers: Record<string, string>;
  body?: any;
  query?: Record<string, string>;
};
```

...the call order is preserved.

If you want to create a different request record you can do so by providing a custom `requestLogger`:

```ts
import { createMSWInspector, defaultRequestLogger } from 'msw-inspector';

const mswInspector = createMSWInspector({
  requestLogger: async (req) => {
    // Optionally use the default request mapper to get the default request log
    const defaultRecord = await defaultRequestLogger(req);

    return {
      myMethodProp: req.method,
      myBodyProp: defaultRecord.body,
    };
  },
});
```

#### `getRequests` Options

`getRequests` accepts an optional options object

```ts
mswInspector.getRequests(string, {
  debug: boolean, // Throw debug error when no matching requests found
});
```

## Todo

- Consider listening to network layer with [`@mswjs/interceptors`](https://github.com/mswjs/interceptors) and make MSW inspector usable in non-`msw` projects
- Todo find out why `SetupServer | SetupWorker` union causes a type error in lifecycle events
- Consider optionally returning requests not intercepted by `msw` (`request:start`/ `request:match`)

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
