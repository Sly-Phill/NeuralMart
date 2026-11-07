// Small helpers shared by every /api function. They work the same on the local
// Express dev server and on Vercel's Node.js runtime.
import { DbConfigError } from './db.js';

export class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const badRequest = (msg) => new HttpError(400, msg, 'BAD_REQUEST');
export const unauthorized = (msg = 'Please log in to continue.') => new HttpError(401, msg, 'UNAUTHORIZED');
export const forbidden = (msg) => new HttpError(403, msg, 'FORBIDDEN');
export const notFound = (msg = 'Not found.') => new HttpError(404, msg, 'NOT_FOUND');

const isDbDown = (err) => {
  if (err instanceof DbConfigError) return true;
  const text = `${err?.name} ${err?.message} ${err?.cause?.code ?? ''} ${err?.sourceError?.message ?? ''}`;
  return /fetch failed|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|ECONNRESET|EAI_AGAIN|NeonDbError: .*(password|endpoint|connect)|Error connecting/i.test(text);
};

/**
 * Wraps a handler map like { GET: fn, POST: fn } into a Vercel-style function.
 * Handles method routing, JSON bodies, errors and "database unreachable".
 */
export function handler(methods) {
  return async (req, res) => {
    const fn = methods[req.method];
    if (!fn) {
      res.setHeader('Allow', Object.keys(methods).join(', '));
      return res.status(405).json({ error: `Method ${req.method} not allowed.`, code: 'METHOD_NOT_ALLOWED' });
    }
    try {
      if (typeof req.body === 'string' && req.body) {
        try { req.body = JSON.parse(req.body); } catch { throw badRequest('Invalid JSON body.'); }
      }
      req.body = req.body || {};
      res.setHeader('Cache-Control', 'no-store');
      const result = await fn(req, res);
      if (!res.headersSent && result !== undefined) res.status(200).json(result);
    } catch (err) {
      if (err instanceof HttpError) {
        return res.status(err.status).json({ error: err.message, code: err.code });
      }
      if (isDbDown(err)) {
        console.error('[api] database unreachable:', err.message);
        return res.status(503).json({
          error: 'We can’t reach the database right now. Please try again in a moment.',
          code: 'DATABASE_UNAVAILABLE',
        });
      }
      console.error('[api] unexpected error:', err);
      return res.status(500).json({ error: 'Something went wrong on our side. Please try again.', code: 'SERVER_ERROR' });
    }
  };
}

export const str = (v, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
export const int = (v, fallback) => {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
};
