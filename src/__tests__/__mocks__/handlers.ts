import { rest } from 'msw';

export const handlers = [
  rest.get('/foo', (req, res, ctx) => {
    return res(ctx.status(200));
  }),
  rest.post('/foo', (req, res, ctx) => {
    return res(ctx.status(200));
  }),

  rest.get('/bar', (req, res, ctx) => {
    return res(ctx.status(200));
  }),
  rest.post('/bar', (req, res, ctx) => {
    return res(ctx.status(200));
  }),
];
