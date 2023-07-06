import type { MockedRequest, SetupWorker } from 'msw';
import type { SetupServer } from 'msw/node';
import { pathToRegexp } from 'path-to-regexp';
import { defaultRequestMapper } from './defaultRequestMapper';
import { makeErrorMessage } from './makeErrorMessage';

type RequestLog = { req: MockedRequest; record: Record<string, unknown> };

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
  requestMapper?: (req: MockedRequest) => Promise<Record<string, unknown>>;
}) {
  // Store network requests by url
  const requestLog = new Map<string, RequestLog[]>();

  async function logRequest(req: MockedRequest): Promise<void> {
    const { href } = req.url;
    const reqs = requestLog.get(href) || [];
    // @NOTE we need to create the request record now since we can deserialize body only once
    reqs.push({ req, record: await requestMapper(req) });
    requestLog.set(href, reqs);
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
      requestLog.forEach((requests, requestHref) => {
        const requestsURL = new URL(requestHref);
        let pathURL: URL;
        try {
          pathURL = new URL(path);
        } catch (error) {
          throw new Error(
            makeErrorMessage({
              message: `Provided path is invalid: ${path}`,
              requestLog,
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
            requestLog,
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
      requestLog.clear();
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
export { createMSWInspector, defaultRequestMapper };
