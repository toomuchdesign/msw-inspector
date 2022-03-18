import type { MockedRequest } from 'msw';
import type { SetupServerApi } from 'msw/node';

type RequestLogRecord = {
  method: string;
  headers: Record<string, string>;
  body?: MockedRequest['body'];
  query?: Record<string, string>;
};

// @NOTE This is the only touch point with Jest
// @TODO Let user provide it's own framework mock function
type RequestLogEntry = jest.Mock<void, [RequestLogRecord]>;

/**
 * Create a new MSW inspector instance bound to the provided msw server setup
 */
function createMSWInspector({ server }: { server: SetupServerApi }) {
  // Store network requests by url
  const requestLog = new Map<string, RequestLogEntry>();

  function logRequest(req: MockedRequest): void {
    const { method, headers, body } = req;
    const { protocol, host, pathname, searchParams } = req.url;

    // @TODO review key generation
    const key = protocol + '//' + host + pathname;
    const query =
      Array.from(searchParams.keys()).length > 0
        ? Object.fromEntries(searchParams)
        : undefined;

    // Create an inspectionable RequestLogRecord object and store it in requestLog map
    // Create a new request log entry (Jest's mock function) for current pathname or absolute url, if necessary
    if (!requestLog.has(key)) {
      const newRequestLogEntry: RequestLogEntry = jest.fn();
      requestLog.set(key, newRequestLogEntry);
    }

    const requestLogEntry = requestLog.get(key);
    if (requestLogEntry) {
      const requestLogRecord: RequestLogRecord = {
        method,
        headers: headers.all(),
        ...(body && { body }),
        ...(query && { query }),
      };

      requestLogEntry(requestLogRecord);
    }
  }

  return {
    /**
     * Return a Jest mock function holding a RequestLogRecord for each call performed against provided path.
     * Network requested are spied through msw listeners
     *
     * @param {string} path Path of a network request (`/path`)
     * @return {*} {jest.Mock}
     */
    getCalls(path: string): jest.Mock {
      const requestLogEntry = requestLog.get(path);
      if (requestLogEntry) {
        return requestLogEntry;
      }

      const availablePaths = Array.from(requestLog.keys());
      throw new Error(
        `[msw-inspector] Cannot find a matching requests for path: ${path}. Intercepted requests paths are:\n\n${availablePaths.join(
          '\n'
        )}`
      );
    },

    /**
     * Setup a msw spy. Call it before tests are executed
     */
    setup() {
      // https://mswjs.io/docs/extensions/life-cycle-events#methods
      server.events.on('request:start', logRequest);
    },

    /**
     * Clear msw spy call log. Call it before every single test execution
     */
    clear() {
      requestLog.clear();
    },

    /**
     * Tear down msw spy. Call it after all tests are executed
     */
    teardown() {
      server.events.removeListener('request:start', logRequest);
    },
  };
}

export { createMSWInspector };
