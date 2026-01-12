import { json } from '../utils/response.js';
import { getPool } from '../pool/getPool.js';

export async function handleCatalogMovies({ extra, env }) {
  console.log('handleCatalogMovies START - search:', extra?.search || '0');

  try {
    let offset = Number(extra?.search || '0');
    const limit = 21;

    if (isNaN(offset) || offset < 0) {
      console.log('Invalid offset - resetting to 0');
      offset = 0;
    }

    let items = await getPool('movie', env) || [];

    if (items.length === 0) {
      console.log('Movies pool empty - injecting dummies');
      items = [
        { title: "Test Movie One", poster: "https://via.placeholder.com/300x450?text=Movie+1" },
        { title: "Test Movie Two", poster: "https://via.placeholder.com/300x450?text=Movie+2" },
        { title: "Test Movie Three", poster: "https://via.placeholder.com/300x450?text=Movie+3" }
      ];
    }

    if (offset >= items.length) {
      console.log('Movies - end of list');
      return json({ metas: [], hasMore: false });
    }

    const slice = items.slice(offset, offset + limit);
    const metas = slice.slice(0, limit - 1).map((item, index) => ({
      id: `streamindia:movie:${item.id || offset + index}`,
      type: 'movie',
      name: item.title || 'Untitled',
      poster: item.poster || null
    }));

    console.log('Movies - returning', metas.length, 'items, hasMore:', slice.length === limit);

    return json({
      metas,
      hasMore: slice.length === limit
    });
  } catch (err) {
    console.error('handleCatalogMovies CRASH:', err.message);
    return json({ metas: [], hasMore: false });
  }
}