// Server-only database access. Never import this from /src.
import { neon } from '@neondatabase/serverless';

let client;

export class DbConfigError extends Error {}

export function getSql() {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new DbConfigError('DATABASE_URL is not set');
    client = neon(url);
  }
  return client;
}

// Tagged template: sql`select ... where id = ${id}`
export const sql = (strings, ...values) => getSql()(strings, ...values);
// Parameterised string query: query('select ... where id = $1', [id])
export const query = (text, params = []) => getSql().query(text, params);
export const transaction = (queries) => getSql().transaction(queries);
