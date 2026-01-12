import { json } from '../utils/response.js';
import { getPool } from '../pool/getPool.js';

export async function handleCatalogMovies({ extra, env }) {
  const offset = parseInt(extra?.search || '0', 10);
  const limit = 21;

  const items = await getPool('movie', env) || [];

  // Temporary debug fallback if pool empty
  if (items.length === 0) {
    items = [
      { title: "Test Movie 1", poster: "https://via.placeholder.com/300x450?text=Movie1" },
      { title: "Test Movie 2", poster: "https://via.placeholder.com/300x450?text=Movie2" },
      { title: "Test Movie 3", poster: "https://via.placeholder.com/300x450?text=Movie3" }
    ];
  }

  if (offset >= items.length) {
    return json({ metas: [], hasMore: false });
  }

  const slice = items.slice(offset, offset + limit);
  const metas = slice.slice(0, limit - 1).map((item, index) => ({
    id: `streamindia:movie:${offset + index}`,
    type: 'movie',
    name: item.title || 'Untitled',
    poster: item.poster || null,
  }));

  return json({
    metas,
    hasMore: slice.length === limit
  });
}