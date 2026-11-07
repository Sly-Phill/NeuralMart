// GET    /api/cart                                   → the logged-in user's cart
// POST   /api/cart { slug, plan? }                   → add an app (adds a seat if already there)
// POST   /api/cart { bundle, plan? }                 → add every app in a bundle at the bundle discount
// PATCH  /api/cart { id, plan?, quantity? }          → change plan / quantity
// DELETE /api/cart?id=...                            → remove one item
import { handler, badRequest, notFound, str, int } from './_lib/http.js';
import { sql } from './_lib/db.js';
import { requireUser } from './_lib/auth.js';
import { loadCart } from './_lib/cart.js';

const planOf = (v) => (v === 'yearly' ? 'yearly' : 'monthly');

export default handler({
  async GET(req) {
    const user = await requireUser(req);
    return loadCart(user.id);
  },

  async POST(req) {
    const user = await requireUser(req);
    const plan = planOf(req.body.plan);
    const bundle = str(req.body.bundle, 80);
    const slug = str(req.body.slug, 80);

    if (bundle) {
      const rows = await sql`
        INSERT INTO cart_items (user_id, app_id, plan, quantity, bundle_id)
        SELECT ${user.id}, ba.app_id, ${plan}, 1, b.id
        FROM bundles b JOIN bundle_apps ba ON ba.bundle_id = b.id
        WHERE b.slug = ${bundle}
        ON CONFLICT (user_id, app_id) DO UPDATE SET bundle_id = EXCLUDED.bundle_id, plan = EXCLUDED.plan
        RETURNING id`;
      if (rows.length === 0) throw notFound('That bundle doesn’t exist.');
      return loadCart(user.id);
    }

    if (!slug) throw badRequest('Which app should we add?');
    const rows = await sql`
      INSERT INTO cart_items (user_id, app_id, plan, quantity)
      SELECT ${user.id}, id, ${plan}, 1 FROM apps WHERE slug = ${slug}
      ON CONFLICT (user_id, app_id) DO UPDATE SET quantity = LEAST(cart_items.quantity + 1, 50)
      RETURNING id`;
    if (rows.length === 0) throw notFound('That app doesn’t exist.');
    return loadCart(user.id);
  },

  async PATCH(req) {
    const user = await requireUser(req);
    const id = int(req.body.id, 0);
    if (!id) throw badRequest('Which cart item?');
    const plan = req.body.plan == null ? null : planOf(req.body.plan);
    const qty = req.body.quantity == null ? null : Math.min(50, Math.max(1, int(req.body.quantity, 1)));
    const rows = await sql`
      UPDATE cart_items SET plan = COALESCE(${plan}, plan), quantity = COALESCE(${qty}::int, quantity)
      WHERE id = ${id} AND user_id = ${user.id}
      RETURNING id`;
    if (rows.length === 0) throw notFound('That item is no longer in your cart.');
    return loadCart(user.id);
  },

  async DELETE(req) {
    const user = await requireUser(req);
    const id = int(req.query.id, 0);
    await sql`DELETE FROM cart_items WHERE id = ${id} AND user_id = ${user.id}`;
    return loadCart(user.id);
  },
});
