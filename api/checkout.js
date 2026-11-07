// GET  /api/checkout?promo=CODE   → check a promo code { code, percentOff }
// POST /api/checkout { promoCode } → mock payment: create a paid order, move items to My Library, empty the cart.
// No card details are ever sent to or stored by the server.
import { handler, badRequest, str } from './_lib/http.js';
import { sql } from './_lib/db.js';
import { requireUser } from './_lib/auth.js';
import { loadCart, totals, UNIT_PRICE_SQL } from './_lib/cart.js';
import { query } from './_lib/db.js';

async function findPromo(raw) {
  const code = str(raw, 40).toUpperCase();
  if (!code) return null;
  const [promo] = await sql`SELECT code, percent_off FROM promo_codes WHERE code = ${code} AND active`;
  if (!promo) throw badRequest(`“${code}” isn’t a valid promo code.`);
  return { code: promo.code, percentOff: promo.percent_off };
}

export default handler({
  // A wrong code is a normal answer ({ valid: false }), not an HTTP error.
  async GET(req) {
    await requireUser(req);
    try {
      const promo = await findPromo(req.query.promo);
      if (!promo) return { valid: false, error: 'Enter a promo code first.' };
      return { valid: true, ...promo };
    } catch (err) {
      if (err.status === 400) return { valid: false, error: err.message };
      throw err;
    }
  },

  async POST(req) {
    const user = await requireUser(req);
    const promo = await findPromo(req.body.promoCode);
    const cart = await loadCart(user.id);
    if (cart.items.length === 0) throw badRequest('Your cart is empty.');
    const t = totals(cart.subtotal, promo?.percentOff || 0);

    // One atomic statement: create order + items, add/renew apps in the library, empty the cart.
    const [order] = await query(
      `WITH lines AS (
         SELECT ci.app_id, ci.plan, ROUND(${UNIT_PRICE_SQL} * ci.quantity, 2) AS price
         FROM cart_items ci
         JOIN apps a ON a.id = ci.app_id
         LEFT JOIN bundles b ON b.id = ci.bundle_id
         WHERE ci.user_id = $1
       ), o AS (
         INSERT INTO orders (user_id, total, promo_code, status)
         VALUES ($1, $2, $3, 'paid')
         RETURNING id, created_at
       ), oi AS (
         INSERT INTO order_items (order_id, app_id, plan, price)
         SELECT o.id, l.app_id, l.plan, l.price FROM o, lines l
         RETURNING app_id
       ), lib AS (
         INSERT INTO user_apps (user_id, app_id, plan, purchased_at, renews_at)
         SELECT $1, l.app_id, l.plan, now(),
                now() + CASE WHEN l.plan = 'yearly' THEN interval '1 year' ELSE interval '1 month' END
         FROM lines l
         ON CONFLICT (user_id, app_id) DO UPDATE
           SET plan = EXCLUDED.plan, renews_at = EXCLUDED.renews_at
         RETURNING app_id
       ), emptied AS (
         DELETE FROM cart_items WHERE user_id = $1 RETURNING id
       )
       SELECT o.id, o.created_at, (SELECT count(*) FROM oi)::int AS item_count, (SELECT count(*) FROM emptied)::int AS removed
       FROM o`,
      [user.id, t.total, promo?.code ?? null],
    );

    return {
      order: {
        id: `NM-${String(order.id).padStart(6, '0')}`,
        createdAt: order.created_at,
        ...t,
        promoCode: promo?.code ?? null,
        apps: cart.items.map((i) => i.app),
      },
    };
  },
});
