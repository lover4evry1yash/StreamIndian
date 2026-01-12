import { json } from '../utils/response.js';
import { getPool } from '../pool/getPool.js';

export async function handleCatalogMovies({ extra, env }) {
  const offset = parseInt(extra?.search || '0', 10);
  const limit = 21;

  let items = await getPool('movie', env) || [];

  // Fallback dummies if real pool is empty (remove this block later)
  if (items.length === 0) {
    items = [
      { title: "Test Movie One", poster: "https://via.placeholder.com/300x450?text=Movie+1" },
      { title: "Test Movie Two", poster: "https://via.placeholder.com/300x450?text=Movie+2" },
      { title: "Test Movie Three", poster: "https://via.placeholder.com/300x450?text=Movie+3" },
      { title: "Test Movie Four", poster: "https://via.placeholder.com/300x450?text=Movie+4" },
      { title: "Test Movie Five", poster: "https://via.placeholder.com/300x450?text=Movie+5" }
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
    poster: item.poster || null
  }));

  return json({
    metas,
    hasMore: slice.length === limit
  });
}