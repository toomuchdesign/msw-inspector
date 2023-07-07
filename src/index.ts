import type { MockedRequest, SetupWorker } from 'msw';
import type { SetupServer } from 'msw/node';
import { pathToRegexp } from 'path-to-regexp';
import { defaultRequestLogger } from './defaultRequestLogger';
import { makeErrorMessage } from './makeErrorMessage';

type RequestLog = Record<string, unknown>;

/**
 * Create a new MSW inspector instance bound to the provided msw server setup
 */
function createMSWInspector<FunctionMock extends Function>({
  mockSetup,
  mockFactory,
  requestLogger = defaultRequestLogger,
}: {
  mockSetup: SetupServer | SetupWorker;
  mockFactory: () => FunctionMock;
  requestLogger?: (req: MockedRequest) => Promise<Record<string, unknown>>;
}) {
  // Store intercepted network requests by url
  const requestLogs = new Map<string, RequestLog[]>();

  async function logRequest(req: MockedRequest): Promise<void> {
    const { href } = req.url;
    const currentRequestLogs = requestLogs.get(href) || [];
    const newLog = await requestLogger(req);
    currentRequestLogs.push(newLog);
    requestLogs.set(href, currentRequestLogs);
  }

  return {
    /**
     * Return a Jest mock function holding a RequestLogRecord for each call performed against provided path.
     * Network requested are spied through msw listeners
     *
     * @param {string} path Path of a network request (`/path`)
     * @return {*} {FunctionMock}
     */
    getRequests(path: string, { debug = true } = {}): FunctionMock {
      let pathURL: URL;
      try {
        pathURL = new URL(path);
      } catch (error) {
        throw new Error(
          makeErrorMessage({
            message: `Provided path is invalid: ${path}`,
            requestLogs,
          }),
        );
      }
      const pathRegex = pathToRegexp(pathURL.pathname);

      // Look for matching logged request records and return them as mock function calls
      const matches: RequestLog[] = [];
      requestLogs.forEach((requests, loggedRequestHref) => {
        const loggedRequestURL = new URL(loggedRequestHref);

        // Test origins
        if (pathURL.origin !== loggedRequestURL.origin) {
          return;
        }

        // Test paths
        if (pathRegex.test(loggedRequestURL.pathname)) {
          matches.push(...requests);
        }
      });

      if (matches.length === 0 && debug) {
        throw new Error(
          makeErrorMessage({
            message: `Cannot find a matching requests for path: ${path}`,
            requestLogs,
          }),
        );
      }

      const functionMock = mockFactory();
      matches.forEach((log) => {
        functionMock(log);
      });
      return functionMock;
    },

    /**
     * Setup a msw spy. Call it before tests are executed
     */
    setup() {
      // https://mswjs.io/docs/extensions/life-cycle-events#methods
      //@ts-expect-error type check seems to fail because of  SetupServer | SetupWorker union
      mockSetup.events.on('request:match', logRequest);
      return this;
    },

    /**
     * Clear msw spy call log. Call it before every single test execution
     */
    clear() {
      requestLogs.clear();
      return this;
    },

    /**
     * Tear down msw spy. Call it after all tests are executed
     */
    teardown() {
      //@ts-expect-error type check seems to fail because of  SetupServer | SetupWorker union
      mockSetup.events.removeListener('request:match', logRequest);
      return this;
    },
  };
}

export type MswInspector = ReturnType<typeof createMSWInspector>;
export { createMSWInspector, defaultRequestLogger };
