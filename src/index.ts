import type { MockedRequest, SetupWorker } from 'msw';
import type { SetupServer } from 'msw/node';
import { pathToRegexp } from 'path-to-regexp';
import { defaultRequestLogger } from './defaultRequestLogger';
import { makeErrorMessage } from './makeErrorMessage';

type RequestLog = { req: MockedRequest; record: Record<string, unknown> };

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
  // Store network requests by url
  const requestLogs = new Map<string, RequestLog[]>();

  async function logRequest(req: MockedRequest): Promise<void> {
    const { href } = req.url;
    const currentRequestLogs = requestLogs.get(href) || [];
    currentRequestLogs.push({ req, record: await requestLogger(req) });
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
    async getRequests(path: string): Promise<FunctionMock> {
      const matches: RequestLog[] = [];
      requestLogs.forEach((requests, requestHref) => {
        const requestsURL = new URL(requestHref);
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

        if (pathURL.origin !== requestsURL.origin) {
          return;
        }

        const regexp = pathToRegexp(pathURL.pathname);
        if (regexp.exec(requestsURL.pathname)) {
          matches.push(...requests);
        }
      });

      if (matches.length === 0) {
        throw new Error(
          makeErrorMessage({
            message: `Cannot find a matching requests for path: ${path}`,
            requestLogs,
          }),
        );
      }

      const functionMock = mockFactory();
      for (const { record } of matches) {
        functionMock(record);
      }
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
