import { rest } from 'msw';

export const handlers = [
  rest.get('http://test.com/foo', (req, res, ctx) => {
    return res(ctx.status(200));
  }),
  rest.post('http://test.com/foo', (req, res, ctx) => {
    return res(ctx.status(200));
  }),

  rest.get('http://test.com/bar', (req, res, ctx) => {
    return res(ctx.status(200));
  }),
  rest.post('http://test.com/bar', (req, res, ctx) => {
    return res(ctx.status(200));
  }),
];
