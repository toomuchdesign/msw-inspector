import qs, { ParsedQs } from 'qs';
import type { MockedRequest } from 'msw';

export type DefaultRequestLogRecord = {
  method: string;
  headers: Record<string, string>;
  body?: any;
  query?: ParsedQs;
};

export async function defaultRequestMapper(
  req: MockedRequest,
): Promise<DefaultRequestLogRecord> {
  const { method, headers } = req;
  const { protocol, host, pathname, search } = req.url;

  // @TODO review key generation
  const key = protocol + '//' + host + pathname;
  const query = search ? qs.parse(search.substring(1)) : undefined;

  const bodyAsText = await req.text();
  let body;

  // A rough attempt to support both text and json bodies
  try {
    body = JSON.parse(bodyAsText);
  } catch (err) {
    body = bodyAsText;
  }

  return {
    method,
    headers: headers.all(),
    ...(body && { body }),
    ...(query && { query }),
  };
}
