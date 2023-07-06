import { rest } from 'msw';

export const handlers = [
  rest.get('http://origin.com', (req, res, ctx) => {
    return res(ctx.status(200));
  }),

  rest.get('http://origin.com/path/:param', (req, res, ctx) => {
    return res(ctx.status(200));
  }),

  rest.get('http://origin.com/path/:param', (req, res, ctx) => {
    return res(ctx.status(200));
  }),

  rest.get('http://origin.com:1234/path/:param', (req, res, ctx) => {
    return res(ctx.status(200));
  }),

  rest.post('http://origin.com/path/:param', (req, res, ctx) => {
    return res(ctx.status(200));
  }),
];
