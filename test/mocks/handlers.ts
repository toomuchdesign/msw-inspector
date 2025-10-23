import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('http://origin.com/non-json-response', () => {
    return new HttpResponse({ status: 404 });
  }),

  http.post('http://origin.com/used-body', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(body, { status: 200 });
  }),

  http.get('http://origin.com/:param1?/:param2?/:param3?', () => {
    return HttpResponse.json({ status: 200 });
  }),

  http.post('http://origin.com/path/:param1?/:param2?/:param3?', () => {
    return HttpResponse.json({ status: 200 });
  }),

  http.get('http://origin.com:1234/*', () => {
    return HttpResponse.json({ status: 200 });
  }),
];
