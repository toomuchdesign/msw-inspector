/**
 * Given a regex url, find relevant matching MSW intercepted requests
 */
export function matchRegexUrl({
  url,
  interceptedRequests,
}: {
  url: RegExp;
  interceptedRequests: Map<string, Request[]>;
}): Request[] {
  const matches: Request[] = [];
  interceptedRequests.forEach((requests) => {
    const matchingRequests = requests.filter((request) =>
      url.test(request.url),
    );
    matches.push(...matchingRequests);
  });
  return matches;
}
