// GET /api/stats → real counts for the landing page counters
import { handler } from './_lib/http.js';
import { sql } from './_lib/db.js';

export default handler({
  async GET() {
    const [row] = await sql`
      SELECT (SELECT count(*) FROM apps)::int                         AS apps,
             (SELECT count(*) FROM users WHERE role = 'buyer')::int  AS customers,
             (SELECT count(*) FROM order_items)::int                 AS purchases`;
    return row;
  },
});
