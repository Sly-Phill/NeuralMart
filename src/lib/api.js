// The browser only ever talks to our own /api functions — never to the database.

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const OFFLINE_MSG = 'Can’t reach the NeuralMart server. Check that `npm run dev` is running, then try again.';

export async function api(path, { method = 'GET', body, signal } = {}) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      signal,
      credentials: 'same-origin',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    throw new ApiError(OFFLINE_MSG, 0, 'NETWORK');
  }
  let data = null;
  try { data = await res.json(); } catch { /* non-JSON (e.g. proxy error) */ }
  if (!res.ok) {
    if (!data) throw new ApiError(OFFLINE_MSG, res.status, 'API_DOWN');
    throw new ApiError(data.error || 'Something went wrong.', res.status, data.code || 'ERROR');
  }
  return data;
}

export const isDbDown = (err) => ['DATABASE_UNAVAILABLE', 'API_DOWN', 'NETWORK'].includes(err?.code);
