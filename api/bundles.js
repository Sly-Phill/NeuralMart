// GET /api/bundles → bundles with their apps, full price and savings
import { handler } from './_lib/http.js';
import { sql, query } from './_lib/db.js';
import { APP_SELECT, toApp } from './_lib/apps.js';

export default handler({
  async GET() {
    const [bundles, links, appRows] = await Promise.all([
      sql`SELECT id, slug, name, description, price, savings_percent, icon_name, brand_colors FROM bundles ORDER BY id`,
      sql`SELECT bundle_id, app_id FROM bundle_apps ORDER BY id`,
      query(`${APP_SELECT} WHERE a.id IN (SELECT app_id FROM bundle_apps)`),
    ]);
    const apps = new Map(appRows.map((r) => [r.id, toApp(r)]));
    return {
      bundles: bundles.map((b) => {
        const list = links.filter((l) => l.bundle_id === b.id).map((l) => apps.get(l.app_id)).filter(Boolean);
        return {
          id: b.slug,
          name: b.name,
          blurb: b.description,
          icon: b.icon_name,
          colors: b.brand_colors,
          savings: b.savings_percent,
          price: Number(b.price),
          full: list.reduce((s, a) => s + a.price, 0),
          apps: list,
        };
      }),
    };
  },
});
