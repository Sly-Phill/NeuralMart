// Local stand-in for Vercel's /api runtime.
// It mounts the exact same files from /api using Vercel's file-based routing rules:
//   api/stats.js          -> /api/stats
//   api/apps/index.js     -> /api/apps
//   api/apps/[slug].js    -> /api/apps/:slug   (exposed as req.query.slug, like Vercel)
// Files and folders starting with "_" (e.g. api/_lib) are helpers, not routes.
import express from 'express';
import { readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const API_DIR = join(ROOT, 'api');
const PORT = Number(process.env.API_PORT) || 3001;

if (existsSync(join(ROOT, '.env'))) process.loadEnvFile(join(ROOT, '.env'));

function findRoutes(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name.startsWith('_') || name.startsWith('.')) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...findRoutes(full));
    else if (/\.(m?js)$/.test(name)) out.push(full);
  }
  return out;
}

function toExpressPath(file) {
  let p = relative(API_DIR, file).split(sep).join('/').replace(/\.m?js$/, '');
  p = p.replace(/(^|\/)index$/, '');
  p = p.replace(/\[\.\.\.(\w+)\]/g, ':$1(*)').replace(/\[(\w+)\]/g, ':$1');
  return `/api${p ? `/${p}` : ''}`;
}

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

const routes = findRoutes(API_DIR)
  .map((file) => ({ file, path: toExpressPath(file) }))
  // static segments win over dynamic ones, like on Vercel
  .sort((a, b) => (a.path.match(/:/g) || []).length - (b.path.match(/:/g) || []).length || b.path.length - a.path.length);

for (const { file, path } of routes) {
  const mod = await import(pathToFileURL(file).href);
  const fn = mod.default;
  if (typeof fn !== 'function') {
    console.warn(`[api] ${path}: no default export, skipped`);
    continue;
  }
  app.all(path, (req, res, next) => {
    req.query = { ...req.query, ...req.params };
    Promise.resolve(fn(req, res)).catch(next);
  });
}

app.use('/api', (req, res) => res.status(404).json({ error: 'That API route doesn’t exist.', code: 'NOT_FOUND' }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body.', code: 'BAD_REQUEST' });
  console.error('[api] crash:', err);
  res.status(500).json({ error: 'Something went wrong on our side.', code: 'SERVER_ERROR' });
});

app.listen(PORT, () => {
  console.log(`[api] ${routes.length} routes ready on http://localhost:${PORT}`);
  for (const r of routes) console.log(`      ${r.path.padEnd(22)} ← ${relative(ROOT, r.file)}`);
});
