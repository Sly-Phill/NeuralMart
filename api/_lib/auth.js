// Session handling: a signed JWT stored in an httpOnly cookie.
import { SignJWT, jwtVerify } from 'jose';
import { unauthorized } from './http.js';
import { sql } from './db.js';

const COOKIE = 'nm_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const secret = () => {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) throw new Error('JWT_SECRET is missing or too short (needs 32+ characters).');
  return new TextEncoder().encode(s);
};

export function parseCookies(req) {
  if (req.cookies && typeof req.cookies === 'object') return req.cookies;
  const out = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

const cookieAttrs = (maxAge) =>
  [`Path=/`, `HttpOnly`, `SameSite=Lax`, `Max-Age=${maxAge}`, process.env.NODE_ENV === 'production' ? 'Secure' : null]
    .filter(Boolean).join('; ');

export async function setSession(res, user) {
  const token = await new SignJWT({ name: user.full_name })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; ${cookieAttrs(MAX_AGE)}`);
}

export function clearSession(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; ${cookieAttrs(0)}`);
}

/** Returns the logged-in user ({ id, email, full_name, role }) or null. */
export async function getUser(req) {
  const token = parseCookies(req)[COOKIE];
  if (!token) return null;
  let payload;
  try {
    ({ payload } = await jwtVerify(token, secret(), { algorithms: ['HS256'] }));
  } catch {
    return null;
  }
  const id = Number(payload.sub);
  if (!Number.isInteger(id)) return null;
  const [user] = await sql`SELECT id, email, full_name, role FROM users WHERE id = ${id}`;
  return user || null;
}

/** Like getUser, but throws 401 when nobody is logged in. */
export async function requireUser(req) {
  const user = await getUser(req);
  if (!user) throw unauthorized();
  return user;
}

export const publicUser = (u) => ({ id: u.id, email: u.email, fullName: u.full_name, role: u.role });
