import qs, { ParsedQs } from 'qs';
import { makeErrorMessage } from './makeErrorMessage';

export type DefaultRequestRecord = {
  method: string;
  headers: Record<string, string>;
  body?: any;
  query?: ParsedQs;
};

export async function defaultRequestLogger(
  request: Request,
): Promise<DefaultRequestRecord> {
  if (request.bodyUsed) {
    throw new Error(
      '[msw-inspector] request.body already read. Make sure your msw handlers clone the request with "request.clone()" before they read the body.',
    );
  }

  const { method, headers, url } = request;
  const { search } = new URL(url);
  const query = search ? qs.parse(search.substring(1)) : undefined;

  /**
   * Rough attempt to support both text and json bodies.
   * Shall we rely on "content-type" header instead?
   */
  let body;
  try {
    body = await request.clone().json();
  } catch (err) {
    body = await request.clone().text();
  }

  return {
    method,
    headers: Object.fromEntries(headers),
    ...(body ? { body } : {}),
    ...(query && { query }),
  };
}
