// GET    /api/wishlist            → the logged-in user's wishlisted apps
// POST   /api/wishlist { slug }   → add
// DELETE /api/wishlist?slug=...   → remove
import { handler, badRequest, notFound, str } from './_lib/http.js';
import { sql, query } from './_lib/db.js';
import { requireUser } from './_lib/auth.js';
import { APP_SELECT, toApp } from './_lib/apps.js';

const list = async (userId) => {
  const rows = await query(
    `${APP_SELECT} JOIN wishlist w ON w.app_id = a.id AND w.user_id = $1 ORDER BY w.created_at DESC`, [userId]);
  return { apps: rows.map(toApp) };
};

export default handler({
  async GET(req) {
    const user = await requireUser(req);
    return list(user.id);
  },
  async POST(req) {
    const user = await requireUser(req);
    const slug = str(req.body.slug, 80);
    if (!slug) throw badRequest('Which app?');
    const [row] = await sql`
      INSERT INTO wishlist (user_id, app_id)
      SELECT ${user.id}, id FROM apps WHERE slug = ${slug}
      ON CONFLICT (user_id, app_id) DO NOTHING
      RETURNING id`;
    if (!row) {
      const [exists] = await sql`SELECT 1 FROM apps WHERE slug = ${slug}`;
      if (!exists) throw notFound('That app doesn’t exist.');
    }
    return list(user.id);
  },
  async DELETE(req) {
    const user = await requireUser(req);
    const slug = str(req.query.slug, 80);
    await sql`DELETE FROM wishlist WHERE user_id = ${user.id} AND app_id = (SELECT id FROM apps WHERE slug = ${slug})`;
    return list(user.id);
  },
});
