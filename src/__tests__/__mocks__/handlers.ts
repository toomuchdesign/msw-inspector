import { rest } from 'msw';

export const handlers = [
  rest.get('http://absolute.path/*', (req, res, ctx) => {
    return res(ctx.status(200));
  }),
  rest.post('http://absolute.path/*', (req, res, ctx) => {
    return res(ctx.status(200));
  }),
];
