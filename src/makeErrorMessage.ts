export function makeErrorMessage({
  message,
  requestLogs,
}: {
  message: string;
  requestLogs: Map<string, unknown>;
}): string {
  const availablePaths = Array.from(requestLogs.keys());
  return `[msw-inspector] ${message}. Intercepted requests paths are:\n\n${availablePaths.join(
    '\n',
  )}`;
}
