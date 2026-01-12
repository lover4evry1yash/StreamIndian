import { json } from '../utils/response.js';
import { getPool } from '../pool/getPool.js';

export async function handleCatalogSeries({ extra, env }) {
  console.log('handleCatalogSeries START - search:', extra?.search || '0');

  try {
    const offset = parseInt(extra?.search || '0', 10);
    const limit = 21;

    const items = await getPool('series', env) || [];

    if (offset >= items.length) {
      return json({ metas: [], hasMore: false });
    }

    const slice = items.slice(offset, offset + limit);
    const metas = slice.slice(0, limit - 1).map((item, index) => ({
      id: `streamindia:series:${item.id || offset + index}`,
      type: 'series',
      name: item.title || 'Untitled',
      poster: item.poster || null
    }));

    return json({
      metas,
      hasMore: slice.length === limit
    });
  } catch (err) {
    console.error('handleCatalogSeries CRASH:', err.message);
    return json({ metas: [], hasMore: false });
  }
}