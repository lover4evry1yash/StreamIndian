import { json } from '../utils/response.js';
import { getPool } from '../pool/getPool.js';

export async function handleCatalogSeries({ extra, env }) {
  console.log('handleCatalogSeries START - search:', extra?.search || '0');

  try {
    const offset = Number(extra?.search || '0');
    const limit = 21;

    let items = await getPool('series', env) || [];

    if (items.length === 0) {
      console.log('Series pool empty - injecting dummies');
      items = [
        { title: "Mirzapur", poster: "https://via.placeholder.com/300x450?text=Mirzapur" },
        { title: "Sacred Games", poster: "https://via.placeholder.com/300x450?text=Sacred+Games" },
        { title: "Paatal Lok", poster: "https://via.placeholder.com/300x450?text=Paatal+Lok" }
      ];
    }

    if (isNaN(offset) || offset < 0) {
      console.log('Invalid offset - resetting to 0');
      offset = 0;
    }

    if (offset >= items.length) {
      console.log('Series - end of list');
      return json({ metas: [], hasMore: false });
    }

    const slice = items.slice(offset, offset + limit);
    const metas = slice.slice(0, limit - 1).map((item, index) => ({
      id: `streamindia:series:${item.id || offset + index}`,
      type: 'series',
      name: item.title || 'Untitled',
      poster: item.poster || null
    }));

    console.log('Series - returning', metas.length, 'items, hasMore:', slice.length === limit);

    return json({
      metas,
      hasMore: slice.length === limit
    });
  } catch (err) {
    console.error('handleCatalogSeries CRASH:', err.message);
    return json({ metas: [], hasMore: false });
  }
}