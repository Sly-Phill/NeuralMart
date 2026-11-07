// GET  /api/apps/:slug  → app, screenshots, reviews, similar apps (+ ownership/review for the logged-in user)
// POST /api/apps/:slug  → { rating, comment } leave or update your review (owners only)
import { handler, notFound, badRequest, forbidden, str, int } from '../_lib/http.js';
import { query, sql } from '../_lib/db.js';
import { APP_SELECT, toApp } from '../_lib/apps.js';
import { getUser, requireUser } from '../_lib/auth.js';

const slugOf = (req) => {
  const s = String(req.query.slug || '').toLowerCase();
  if (!/^[a-z0-9-]{1,80}$/.test(s)) throw notFound('That app doesn’t exist.');
  return s;
};

const loadReviews = (appId) => sql`
  SELECT r.id, r.rating, r.comment, r.created_at, r.user_id, u.full_name
  FROM reviews r JOIN users u ON u.id = r.user_id
  WHERE r.app_id = ${appId}
  ORDER BY r.created_at DESC
  LIMIT 20`;

const toReview = (r) => ({ id: r.id, rating: r.rating, text: r.comment, date: new Date(r.created_at).toISOString(), name: r.full_name, userId: r.user_id });

export default handler({
  async GET(req) {
    const slug = slugOf(req);
    const [row] = await query(`${APP_SELECT} WHERE a.slug = $1`, [slug]);
    if (!row) throw notFound('That app doesn’t exist.');
    const app = toApp(row);
    const user = await getUser(req);

    const [screens, reviews, similarRows, owned] = await Promise.all([
      sql`SELECT image_url FROM app_screenshots WHERE app_id = ${row.id} ORDER BY order_index`,
      loadReviews(row.id),
      query(
        `${APP_SELECT} WHERE a.category_id = (SELECT category_id FROM apps WHERE id = $1) AND a.id <> $1
         ORDER BY a.rating_count DESC LIMIT 4`, [row.id]),
      user ? sql`SELECT 1 FROM user_apps WHERE user_id = ${user.id} AND app_id = ${row.id}` : Promise.resolve([]),
    ]);

    return {
      app: { ...app, screenshots: screens.map((s) => s.image_url) },
      reviews: reviews.map(toReview),
      similar: similarRows.map(toApp),
      owned: owned.length > 0,
      myReview: user ? reviews.map(toReview).find((r) => r.userId === user.id) || null : null,
    };
  },

  async POST(req) {
    const user = await requireUser(req);
    const slug = slugOf(req);
    const rating = int(req.body.rating, 0);
    const comment = str(req.body.comment, 1000);
    if (rating < 1 || rating > 5) throw badRequest('Pick a rating from 1 to 5 stars.');
    if (comment.length < 3) throw badRequest('Add a few words to your review.');

    const [app] = await sql`SELECT id FROM apps WHERE slug = ${slug}`;
    if (!app) throw notFound('That app doesn’t exist.');
    const [owns] = await sql`SELECT 1 FROM user_apps WHERE user_id = ${user.id} AND app_id = ${app.id}`;
    if (!owns) throw forbidden('Only people who own this app can review it.');

    // Upsert the review and adjust the running average in ONE statement:
    // a new review adds to the count, an edited review swaps its old rating for the new one.
    const [result] = await sql`
      WITH prev AS (
        SELECT rating FROM reviews WHERE app_id = ${app.id} AND user_id = ${user.id}
      ), up AS (
        INSERT INTO reviews (app_id, user_id, rating, comment)
        VALUES (${app.id}, ${user.id}, ${rating}, ${comment})
        ON CONFLICT (app_id, user_id) DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, created_at = now()
        RETURNING id
      )
      UPDATE apps a SET
        rating_count = a.rating_count + CASE WHEN EXISTS (SELECT 1 FROM prev) THEN 0 ELSE 1 END,
        rating_avg = ROUND(
          (a.rating_avg * a.rating_count
            - COALESCE((SELECT rating FROM prev), 0)
            + ${rating})::numeric
          / (a.rating_count + CASE WHEN EXISTS (SELECT 1 FROM prev) THEN 0 ELSE 1 END), 2)
      WHERE a.id = ${app.id}
      RETURNING a.rating_avg, a.rating_count, (SELECT id FROM up) AS review_id,
                EXISTS (SELECT 1 FROM prev) AS updated`;

    const reviews = await loadReviews(app.id);
    return {
      updated: result.updated,
      rating: Math.round(Number(result.rating_avg) * 10) / 10,
      ratingCount: result.rating_count,
      reviews: reviews.map(toReview),
      myReview: reviews.map(toReview).find((r) => r.userId === user.id) || null,
    };
  },
});
