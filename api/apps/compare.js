// GET /api/apps/compare?ids=slug1,slug2[,slug3]
import { handler, badRequest } from '../_lib/http.js';
import { query } from '../_lib/db.js';
import { APP_SELECT, toApp, splitList } from '../_lib/apps.js';

export default handler({
  async GET(req) {
    const ids = splitList(req.query.ids, 3);
    if (ids.length === 0) return { apps: [] };
    if (ids.length > 3) throw badRequest('You can compare up to 3 apps.');
    const rows = await query(`${APP_SELECT} WHERE a.slug = ANY($1::text[])`, [ids]);
    const apps = rows.map(toApp).sort((x, y) => ids.indexOf(x.id) - ids.indexOf(y.id));
    return { apps };
  },
});
