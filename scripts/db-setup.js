// npm run db:setup → runs db/schema.sql then db/seed.sql against DATABASE_URL.
// Safe to run again: the schema uses IF NOT EXISTS and the seed uses ON CONFLICT.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';

process.loadEnvFile(fileURLToPath(new URL('../.env', import.meta.url)));
const sql = neon(process.env.DATABASE_URL);

// Split a SQL file into statements, respecting quotes, dollar-quoting and comments.
function splitSql(text) {
  const out = [];
  let cur = '';
  let i = 0;
  let quote = null; // ' or " or $tag$
  while (i < text.length) {
    const ch = text[i];
    if (!quote && ch === '-' && text[i + 1] === '-') { const nl = text.indexOf('\n', i); i = nl === -1 ? text.length : nl; continue; }
    if (!quote && (ch === "'" || ch === '"')) { quote = ch; cur += ch; i++; continue; }
    if (!quote && ch === '$') {
      const m = text.slice(i).match(/^\$[A-Za-z_]*\$/);
      if (m) { quote = m[0]; cur += m[0]; i += m[0].length; continue; }
    }
    if (quote) {
      if (quote.length > 1 && text.startsWith(quote, i)) { cur += quote; i += quote.length; quote = null; continue; }
      if (quote === ch) {
        if (text[i + 1] === ch) { cur += ch + ch; i += 2; continue; } // escaped '' inside string
        quote = null;
      }
      cur += ch; i++; continue;
    }
    if (ch === ';') { if (cur.trim()) out.push(cur.trim()); cur = ''; i++; continue; }
    cur += ch; i++;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

const load = (f) => splitSql(readFileSync(fileURLToPath(new URL(`../db/${f}`, import.meta.url)), 'utf8'));

try {
  const schema = load('schema.sql');
  process.stdout.write(`→ Creating tables (${schema.length} statements)… `);
  await sql.transaction(schema.map((s) => sql.query(s)));
  console.log('done');

  const seed = load('seed.sql');
  process.stdout.write(`→ Loading sample data (${seed.length} statements)… `);
  await sql.transaction(seed.map((s) => sql.query(s)));
  console.log('done\n');

  const [c] = await sql`
    SELECT (SELECT count(*) FROM categories)::int AS categories,
           (SELECT count(*) FROM apps)::int AS apps,
           (SELECT count(*) FROM app_features)::int AS features,
           (SELECT count(*) FROM app_screenshots)::int AS screenshots,
           (SELECT count(*) FROM reviews)::int AS reviews,
           (SELECT count(*) FROM bundles)::int AS bundles,
           (SELECT count(*) FROM bundle_apps)::int AS bundle_apps,
           (SELECT count(*) FROM users)::int AS users,
           (SELECT count(*) FROM promo_codes)::int AS promo_codes`;
  console.log('Row counts:');
  console.table(c);
} catch (err) {
  console.error('\n✖ Database setup failed:', err.message);
  if (/fetch failed|ENOTFOUND|password|authentication/i.test(String(err.message) + String(err.cause))) {
    console.error('  Check that DATABASE_URL in .env is the full Neon connection string and that you are online.');
  }
  process.exit(1);
}
