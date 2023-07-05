export function makeErrorMessage({
  message,
  requestLog,
}: {
  message: string;
  requestLog: Map<string, unknown>;
}): string {
  const availablePaths = Array.from(requestLog.keys());
  return `[msw-inspector] ${message}. Intercepted requests paths are:\n\n${availablePaths.join(
    '\n',
  )}`;
}
