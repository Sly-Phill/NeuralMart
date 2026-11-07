// GET /api/apps?category=&q=&sort=&price=&featured=1&slugs=a,b&limit=
// All filtering, searching and sorting happens in the database.
import { handler, str, int } from '../_lib/http.js';
import { query } from '../_lib/db.js';
import { APP_SELECT, SORTS, toApp, splitList } from '../_lib/apps.js';

export default handler({
  async GET(req) {
    const { category, sort, price, featured, slugs } = req.query;
    const q = str(req.query.q, 100);
    const where = [];
    const params = [];
    const add = (sqlText, value) => { params.push(value); where.push(sqlText.replace('?', `$${params.length}`)); };

    if (category && category !== 'all') add('c.slug = ?', str(category, 40));
    if (price === 'free') where.push('a.price_monthly = 0');
    if (price === 'trial') where.push('a.has_free_trial');
    if (price === 'under20') where.push('a.price_monthly < 20');
    if (featured === '1' || featured === 'true') where.push('a.is_featured');
    const slugList = splitList(slugs);
    if (slugList.length) add('a.slug = ANY(?::text[])', slugList);

    // every word must match somewhere in the app's text, features, use cases or integrations
    for (const word of q.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 6)) {
      add(`(a.name || ' ' || a.tagline || ' ' || a.description || ' ' || c.name || ' ' ||
            array_to_string(a.use_cases, ' ') || ' ' || array_to_string(a.integrations, ' ') || ' ' ||
            COALESCE((SELECT string_agg(f.feature_text, ' ') FROM app_features f WHERE f.app_id = a.id), '')
           ) ILIKE ?`, `%${word.replace(/[%_\\]/g, '\\$&')}%`);
    }

    const order = SORTS[sort] || SORTS.popular;
    const limit = Math.min(Math.max(int(req.query.limit, 100), 1), 100);
    const rows = await query(
      `${APP_SELECT} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY ${order} LIMIT ${limit}`,
      params,
    );
    let apps = rows.map(toApp);
    if (slugList.length && !req.query.sort) apps.sort((x, y) => slugList.indexOf(x.id) - slugList.indexOf(y.id));
    return { apps, count: apps.length };
  },
});
