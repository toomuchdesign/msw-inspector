import type { MockedRequest, SetupWorker } from 'msw';
import type { SetupServer } from 'msw/node';

type RequestLogRecord = {
  method: string;
  headers: Record<string, string>;
  body?: any;
  query?: Record<string, string>;
};

async function defaultRequestMapper(req: MockedRequest): Promise<{
  key: string;
  record: RequestLogRecord;
}> {
  const { method, headers } = req;
  const { protocol, host, pathname, searchParams } = req.url;

  // @TODO review key generation
  const key = protocol + '//' + host + pathname;
  const query =
    Array.from(searchParams.keys()).length > 0
      ? Object.fromEntries(searchParams)
      : undefined;

  const bodyAsText = await req.text();
  let body;

  // A rough attempt to support both text and json bodies
  try {
    body = JSON.parse(bodyAsText);
  } catch (err) {
    body = bodyAsText;
  }

  return {
    key,
    record: {
      method,
      headers: headers.all(),
      ...(body && { body }),
      ...(query && { query }),
    },
  };
}

/**
 * Create a new MSW inspector instance bound to the provided msw server setup
 */
function createMSWInspector<FunctionMock extends Function>({
  mockSetup,
  mockFactory,
  requestMapper = defaultRequestMapper,
}: {
  mockSetup: SetupServer | SetupWorker;
  mockFactory: () => FunctionMock;
  requestMapper?: (req: MockedRequest) => Promise<{
    key: string;
    record: Record<string, any>;
  }>;
}) {
  // Store network requests by url
  const requestLog = new Map<string, FunctionMock>();

  async function logRequest(req: MockedRequest): Promise<void> {
    const { key, record } = await requestMapper(req);

    // Create an inspectionable request log and store it in requestLog map
    // Create a new request log entry (a function mock of any testing framework) for current url, if necessary
    if (!requestLog.has(key)) {
      const newRequestLogEntry = mockFactory();
      requestLog.set(key, newRequestLogEntry);
    }

    const requestLogEntry = requestLog.get(key);
    if (requestLogEntry) {
      // Here we call function mock on order for tests to inspect it
      requestLogEntry(record);
    }
  }

  return {
    /**
     * Return a Jest mock function holding a RequestLogRecord for each call performed against provided path.
     * Network requested are spied through msw listeners
     *
     * @param {string} path Path of a network request (`/path`)
     * @return {*} {FunctionMock}
     */
    getRequests(path: string): FunctionMock {
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
      //@ts-expect-error type check seems to fail because of  SetupServer | SetupWorker union
      mockSetup.events.on('request:start', logRequest);
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
      //@ts-expect-error type check seems to fail because of  SetupServer | SetupWorker union
      mockSetup.events.removeListener('request:start', logRequest);
    },
  };
}

export { createMSWInspector };
