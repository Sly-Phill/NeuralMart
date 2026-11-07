// GET /api/categories → categories with app counts
import { handler } from './_lib/http.js';
import { sql } from './_lib/db.js';

export default handler({
  async GET() {
    const rows = await sql`
      SELECT c.slug, c.name, c.icon, c.description, c.brand_colors, count(a.id)::int AS app_count
      FROM categories c LEFT JOIN apps a ON a.category_id = c.id
      GROUP BY c.id ORDER BY c.sort_order, c.name`;
    return {
      categories: rows.map((c) => ({ id: c.slug, name: c.name, icon: c.icon, blurb: c.description, hue: c.brand_colors, count: c.app_count })),
    };
  },
});
