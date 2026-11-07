// GET  /api/library          → the logged-in user's purchased apps
// POST /api/library { slug } → "Launch": records a usage session for an owned app
import { handler, notFound, str } from './_lib/http.js';
import { sql, query } from './_lib/db.js';
import { requireUser } from './_lib/auth.js';
import { APP_SELECT, toApp } from './_lib/apps.js';

async function load(userId) {
  const rows = await query(
    `SELECT ua.plan AS owned_plan, ua.purchased_at, ua.renews_at, ua.usage_minutes, x.*
     FROM user_apps ua
     JOIN LATERAL (${APP_SELECT} WHERE a.id = ua.app_id) x ON true
     WHERE ua.user_id = $1
     ORDER BY ua.purchased_at DESC`,
    [userId],
  );
  return {
    apps: rows.map((r) => ({
      app: toApp(r),
      plan: r.owned_plan,
      purchasedAt: new Date(r.purchased_at).toISOString(),
      renewsAt: new Date(r.renews_at).toISOString(),
      usageMinutes: r.usage_minutes,
    })),
  };
}

export default handler({
  async GET(req) {
    const user = await requireUser(req);
    return load(user.id);
  },
  async POST(req) {
    const user = await requireUser(req);
    const slug = str(req.body.slug, 80);
    const minutes = 15 + Math.floor(Math.random() * 30); // a simulated work session
    const rows = await sql`
      UPDATE user_apps SET usage_minutes = usage_minutes + ${minutes}
      WHERE user_id = ${user.id} AND app_id = (SELECT id FROM apps WHERE slug = ${slug})
      RETURNING usage_minutes`;
    if (rows.length === 0) throw notFound('You don’t own that app yet.');
    return { ...(await load(user.id)), added: minutes };
  },
});
