import qs, { ParsedQs } from 'qs';
import type { MockedRequest } from 'msw';

export type DefaultRequestRecord = {
  method: string;
  headers: Record<string, string>;
  body?: any;
  query?: ParsedQs;
};

export async function defaultRequestLogger(
  req: MockedRequest,
): Promise<DefaultRequestRecord> {
  const { method, headers, url } = req;
  const { search } = url;
  const query = search ? qs.parse(search.substring(1)) : undefined;

  /**
   * Rough attempt to support both text and json bodies.
   * Shall we rely on "content-type" header instead?
   */
  let body;
  try {
    body = await req.json();
  } catch (err) {
    body = await req.clone().text();
  }

  return {
    method,
    headers: headers.all(),
    ...(body && { body }),
    ...(query && { query }),
  };
}
