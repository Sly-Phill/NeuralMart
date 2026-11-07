// Runs before `npm run dev` and `npm run db:setup`.
//  - creates .env if needed
//  - generates a strong JWT_SECRET if it's missing
//  - stops with clear instructions if DATABASE_URL is missing
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const envPath = fileURLToPath(new URL('../.env', import.meta.url));
let text = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
const get = (k) => (text.match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1] || '').trim().replace(/^["']|["']$/g, '');
const set = (k, v) => {
  text = new RegExp(`^${k}=.*$`, 'm').test(text)
    ? text.replace(new RegExp(`^${k}=.*$`, 'm'), `${k}=${v}`)
    : `${text}${text && !text.endsWith('\n') ? '\n' : ''}${k}=${v}\n`;
};

let changed = false;
if (!get('DATABASE_URL') && !/^DATABASE_URL=/m.test(text)) { set('DATABASE_URL', ''); changed = true; }
if (get('JWT_SECRET').length < 32) {
  set('JWT_SECRET', randomBytes(48).toString('base64url'));
  changed = true;
  console.log('✔ Generated a strong random JWT_SECRET and saved it to .env');
}
if (changed) writeFileSync(envPath, text);

const url = get('DATABASE_URL');
if (!url) {
  console.error(`
✖ DATABASE_URL is missing from .env — NeuralMart needs a Neon Postgres database.

  Get it (free, ~2 minutes):
   1. Go to https://console.neon.tech and sign up / log in.
   2. Create a project (any name, e.g. "neuralmart"; pick the region closest to you).
   3. On the project dashboard click the "Connect" button (top right).
   4. In the "Connect to your database" dialog keep Branch = production, Database = neondb,
      choose the "Connection string" tab, make sure "Connection pooling" is ON,
      then click "Show password" and copy the whole string. It looks like:
      postgresql://neondb_owner:xxxxxxxx@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require
   5. Paste it into the .env file in this folder:
      DATABASE_URL=postgresql://...
   6. Run:  npm run db:setup   then   npm run dev
`);
  process.exit(1);
}
if (!/^postgres(ql)?:\/\//.test(url)) {
  console.error('✖ DATABASE_URL in .env should start with postgresql:// — copy the full connection string from Neon.');
  process.exit(1);
}
