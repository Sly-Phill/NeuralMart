// Cart pricing lives on the server so the browser can never change what an order costs.
import { query } from './db.js';
import { toApp, APP_SELECT } from './apps.js';

export const TAX_RATE = 0.08;
export const round2 = (n) => Math.round(n * 100) / 100;

// Per-unit price for a cart row: plan price, minus the bundle discount if it came from a bundle.
export const UNIT_PRICE_SQL = `
  ROUND((CASE WHEN ci.plan = 'yearly' THEN a.price_yearly ELSE a.price_monthly END)
        * (1 - COALESCE(b.savings_percent, 0) / 100.0), 2)`;

export async function loadCart(userId) {
  const rows = await query(
    `SELECT ci.id AS item_id, ci.plan, ci.quantity, ci.added_at,
            b.slug AS bundle_slug, b.name AS bundle_name, b.savings_percent,
            ${UNIT_PRICE_SQL} AS unit_price, app.*
     FROM cart_items ci
     JOIN apps a ON a.id = ci.app_id
     LEFT JOIN bundles b ON b.id = ci.bundle_id
     JOIN LATERAL (${APP_SELECT} WHERE a.id = ci.app_id) app ON true
     WHERE ci.user_id = $1
     ORDER BY ci.added_at, ci.id`,
    [userId],
  );
  const items = rows.map((r) => {
    const unit = Number(r.unit_price);
    return {
      id: r.item_id,
      app: toApp(r),
      plan: r.plan,
      quantity: r.quantity,
      unitPrice: unit,
      lineTotal: round2(unit * r.quantity),
      bundle: r.bundle_slug ? { id: r.bundle_slug, name: r.bundle_name, savings: r.savings_percent } : null,
    };
  });
  return {
    items,
    count: items.reduce((s, i) => s + i.quantity, 0),
    subtotal: round2(items.reduce((s, i) => s + i.lineTotal, 0)),
  };
}

export function totals(subtotal, percentOff = 0) {
  const discount = round2((subtotal * percentOff) / 100);
  const tax = round2((subtotal - discount) * TAX_RATE);
  return { subtotal, discount, tax, total: round2(subtotal - discount + tax), percentOff };
}
