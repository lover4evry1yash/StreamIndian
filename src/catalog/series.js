import { json } from '../utils/response.js';
import { getPool } from '../pool/getPool.js';

export async function handleCatalogSeries(request, env) {
  const url = new URL(request.url);
const items = await getPool('series', env);
console.log(`Series pool size: ${items.length}`);

  // Use 'search' param as cursor (offset) — enables reliable infinite scroll
  const searchParam = url.searchParams.get('search') || '0';
  const offset = parseInt(searchParam, 10);
  const limit = 21;  // fetch one extra to detect if more exists

  // Get the stable, cached pool of series
  const items = await getPool('series', env);

  // If we've reached the end of the pool
  if (offset >= items.length) {
    return json({
      metas: [],
      hasMore: false
    });
  }

  // Slice the next batch
  const slice = items.slice(offset, offset + limit);

  // Map to Stremio meta objects (stable absolute IDs)
  const metas = slice.slice(0, limit - 1).map((item, index) => ({
    id: `streamindia:series:${offset + index}`,  // absolute, stable ID
    type: 'series',
    name: item.title || item.name || 'Untitled',
    poster: item.poster || null,
    // Optional future fields (uncomment when you enrich the pool):
    // background: item.backdrop || null,
    // logo: item.logo || null,
    // genres: item.genres || [],
    // releaseInfo: item.release_date || item.first_air_date || null,
  }));

  return json({
    metas,
    hasMore: slice.length === limit   // true only if we got the extra item
  });
}