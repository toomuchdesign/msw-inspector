export function makeErrorMessage({
  message,
  interceptedRequests,
}: {
  message: string;
  interceptedRequests: Map<string, Request[]>;
}): string {
  const availablePaths = Array.from(interceptedRequests.keys());
  return `[msw-inspector] ${message}. Intercepted requests paths are:\n\n${availablePaths.join(
    '\n',
  )}`;
}
