import { pathToRegexp } from 'path-to-regexp';
import { makeErrorMessage } from './makeErrorMessage';

/**
 * Given a string url, find relevant matching MSW intercepted requests
 */
export function matchStringUrl({
  url,
  interceptedRequests,
}: {
  url: string;
  interceptedRequests: Map<string, Request[]>;
}): Request[] {
  let pathURL: URL;
  try {
    pathURL = new URL(url);
  } catch (error) {
    throw new Error(
      makeErrorMessage({
        message: `Provided url is invalid: ${url}`,
        interceptedRequests,
      }),
    );
  }
  const pathRegex = pathToRegexp(pathURL.pathname);

  // Look for matching intercepted requests
  const matches: Request[] = [];
  interceptedRequests.forEach((requests, requestHref) => {
    const loggedRequestURL = new URL(requestHref);

    // Test origins
    if (pathURL.origin !== loggedRequestURL.origin) {
      return;
    }

    // Test paths
    if (pathRegex.test(loggedRequestURL.pathname)) {
      matches.push(...requests);
    }
  });
  return matches;
}
