import { json } from '../utils/response.js';
import { getPool } from '../pool/getPool.js';

export async function handleCatalogSeries({ extra, env }) {
  const offset = parseInt(extra?.search || '0', 10);
  const limit = 21;  // Fetch one extra to check for hasMore

  const items = await getPool('series', env) || [];

  if (offset >= items.length) {
    return json({ metas: [], hasMore: false });
  }

  const slice = items.slice(offset, offset + limit);
  const metas = slice.slice(0, limit - 1).map((item, index) => ({
    id: `streamindia:series:${offset + index}`,
    type: 'series',
    name: item.title || item.name || 'Untitled',
    poster: item.poster || null,
  }));

  return json({
    metas,
    hasMore: slice.length === limit  // True if there's more data
  });
}