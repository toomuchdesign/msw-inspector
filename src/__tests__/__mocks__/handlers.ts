import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('http://origin.com', () => {
    return HttpResponse.json({ status: 200 });
  }),

  http.get('http://origin.com/path/:param', () => {
    return HttpResponse.json({ status: 200 });
  }),

  http.get('http://origin.com:1234/path/:param', () => {
    return HttpResponse.json({ status: 200 });
  }),

  http.post('http://origin.com/path/:param', () => {
    return HttpResponse.json({ status: 200 });
  }),
];
