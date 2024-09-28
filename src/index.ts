import type { LifeCycleEventsMap } from 'msw';
import type { SetupWorker } from 'msw/browser';
import type { SetupServer } from 'msw/node';
import { defaultRequestLogger } from './defaultRequestLogger';
import { makeErrorMessage } from './makeErrorMessage';
import { matchStringUrl } from './matchStringUrl';
import { matchRegexUrl } from './matchRegexUrl';
type MockedRequest = LifeCycleEventsMap['request:match'][0]['request'];

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
  const interceptedRequests = new Map<string, Request[]>();

  async function storeRequest(
    ...args: LifeCycleEventsMap['request:match']
  ): Promise<void> {
    interceptedRequests;
    const { request } = args[0];
    const { href } = new URL(request.url);
    const currentHrefRequest = interceptedRequests.get(href) || [];
    currentHrefRequest.push(request);
    interceptedRequests.set(href, currentHrefRequest);
  }

  return {
    /**
     * Return a Jest mock function holding a RequestLogRecord for each call performed against provided path.
     * Network requested are spied through msw listeners
     *
     * @param {string | RegExp} url Url of a network request (`http://origin.com/path`)
     * @return {*} {Promise<FunctionMock>}
     */
    async getRequests(
      url: string | RegExp,
      { debug = true } = {},
    ): Promise<FunctionMock> {
      const matches =
        url instanceof RegExp
          ? matchRegexUrl({ url, interceptedRequests })
          : matchStringUrl({ url, interceptedRequests });
      const functionMock = mockFactory();

      if (matches.length === 0) {
        if (debug) {
          throw new Error(
            makeErrorMessage({
              message: `Cannot find a matching requests for url: ${url}`,
              interceptedRequests,
            }),
          );
        }
        return functionMock;
      }

      // Create logs for each matching request
      const requestLogs = await Promise.all(
        matches.map((request) => requestLogger(request)),
      );

      // Call function mock with each created log
      requestLogs.forEach((log) => {
        functionMock(log);
      });

      return functionMock;
    },

    /**
     * Setup a msw spy. Call it before tests are executed
     */
    setup() {
      // https://mswjs.io/docs/extensions/life-cycle-events#methods
      mockSetup.events.on('request:match', storeRequest);
      return this;
    },

    /**
     * Clear msw spy call log. Call it before every single test execution
     */
    clear() {
      interceptedRequests.clear();
      return this;
    },

    /**
     * Tear down msw spy. Call it after all tests are executed
     */
    teardown() {
      mockSetup.events.removeListener('request:match', storeRequest);
      return this;
    },
  };
}

export type MswInspector = ReturnType<typeof createMSWInspector>;
export { createMSWInspector, defaultRequestLogger };
export type { MockedRequest };
