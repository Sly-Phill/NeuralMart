// /api/auth/signup  POST { fullName, email, password }
// /api/auth/login   POST { email, password }
// /api/auth/logout  POST
// /api/auth/me      GET
// (One file for all four keeps us inside Vercel Hobby's 12-function limit.)
import bcrypt from 'bcryptjs';
import { handler, badRequest, notFound, HttpError, str } from '../_lib/http.js';
import { sql } from '../_lib/db.js';
import { setSession, clearSession, getUser, publicUser } from '../_lib/auth.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const actions = {
  signup: handler({
    async POST(req, res) {
      const fullName = str(req.body.fullName, 80);
      const email = str(req.body.email, 160).toLowerCase();
      const password = typeof req.body.password === 'string' ? req.body.password : '';
      if (fullName.length < 2) throw badRequest('Please tell us your full name.');
      if (!EMAIL_RE.test(email)) throw badRequest('That email address doesn’t look right.');
      if (password.length < 8) throw badRequest('Passwords need at least 8 characters.');
      if (password.length > 72) throw badRequest('Passwords can be at most 72 characters.');

      const hash = await bcrypt.hash(password, 10);
      const [user] = await sql`
        INSERT INTO users (email, password_hash, full_name, role)
        VALUES (${email}, ${hash}, ${fullName}, 'buyer')
        ON CONFLICT (email) DO NOTHING
        RETURNING id, email, full_name, role`;
      if (!user) throw new HttpError(409, 'An account with that email already exists. Try logging in instead.', 'EMAIL_TAKEN');
      await setSession(res, user);
      res.status(201).json({ user: publicUser(user) });
    },
  }),

  login: handler({
    async POST(req, res) {
      const email = str(req.body.email, 160).toLowerCase();
      const password = typeof req.body.password === 'string' ? req.body.password : '';
      if (!email || !password) throw badRequest('Enter your email and password.');
      const [user] = await sql`SELECT id, email, full_name, role, password_hash FROM users WHERE email = ${email}`;
      // Sample/seed accounts have a disabled hash ("!") and can never log in.
      const ok = user && user.password_hash.startsWith('$2') && (await bcrypt.compare(password.slice(0, 72), user.password_hash));
      if (!ok) throw new HttpError(401, 'Email or password is incorrect.', 'INVALID_CREDENTIALS');
      await setSession(res, user);
      return { user: publicUser(user) };
    },
  }),

  logout: handler({
    async POST(req, res) {
      clearSession(res);
      return { ok: true };
    },
  }),

  me: handler({
    async GET(req) {
      const user = await getUser(req);
      return { user: user ? publicUser(user) : null };
    },
  }),
};

export default function auth(req, res) {
  const fn = actions[req.query.action];
  if (!fn) return handler({ GET: () => { throw notFound(); }, POST: () => { throw notFound(); } })(req, res);
  return fn(req, res);
}
