import type { APIRoute } from 'astro';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres_dev:gqcETc7kGBq8AbWRf8Pa@192.168.1.38:5433/rdi_dev',
});

export const GET: APIRoute = async () => {
  try {
    const client = await pool.connect();
    
    // Queue status
    const queueResult = await client.query(`
      SELECT status, COUNT(*)::int as count 
      FROM "JobQueue" 
      GROUP BY status
    `);
    const queue: Record<string, number> = {};
    for (const row of queueResult.rows) {
      queue[row.status] = row.count;
    }

    // Places found in last hour
    const recentPlacesResult = await client.query(`
      SELECT COUNT(*)::int as count 
      FROM "Place" 
      WHERE "createdAt" > NOW() - INTERVAL '1 hour'
    `);
    const recentPlaces = recentPlacesResult.rows[0]?.count || 0;

    // Places found today
    const todayPlacesResult = await client.query(`
      SELECT COUNT(*)::int as count 
      FROM "Place" 
      WHERE "createdAt" > CURRENT_DATE
    `);
    const todayPlaces = todayPlacesResult.rows[0]?.count || 0;

    // Total places
    const totalPlacesResult = await client.query(`
      SELECT COUNT(*)::int as count FROM "Place"
    `);
    const totalPlaces = totalPlacesResult.rows[0]?.count || 0;

    // Recent places with details
    const recentListResult = await client.query(`
      SELECT 
        id, name, "primaryType", "placeCategory", "createdAt"
      FROM "Place"
      WHERE "createdAt" > NOW() - INTERVAL '1 hour'
      ORDER BY "createdAt" DESC
      LIMIT 100
    `);

    // By category today
    const byCategoryResult = await client.query(`
      SELECT "placeCategory", COUNT(*)::int as count
      FROM "Place"
      WHERE "createdAt" > CURRENT_DATE
      GROUP BY "placeCategory"
      ORDER BY count DESC
    `);

    // Pending search jobs
    const pendingSearchesResult = await client.query(`
      SELECT COUNT(*)::int as count 
      FROM "JobQueue" 
      WHERE "jobType" = 'EXECUTE_SEARCH' AND status = 'PENDING'
    `);
    const pendingSearches = pendingSearchesResult.rows[0]?.count || 0;

    // Processing rate (completed in last 5 min)
    const rateResult = await client.query(`
      SELECT COUNT(*)::int as count 
      FROM "JobQueue" 
      WHERE "jobType" = 'EXECUTE_SEARCH' 
        AND status = 'COMPLETED'
        AND "completedAt" > NOW() - INTERVAL '5 minutes'
    `);
    const completedLast5Min = rateResult.rows[0]?.count || 0;
    const ratePerMin = Math.round(completedLast5Min / 5);

    client.release();

    return new Response(JSON.stringify({
      timestamp: new Date().toISOString(),
      queue,
      places: {
        total: totalPlaces,
        today: todayPlaces,
        lastHour: recentPlaces,
      },
      searches: {
        pending: pendingSearches,
        ratePerMin,
        etaMinutes: ratePerMin > 0 ? Math.round(pendingSearches / ratePerMin) : null,
      },
      byCategory: byCategoryResult.rows,
      recentPlaces: recentListResult.rows,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('RDI stats error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
