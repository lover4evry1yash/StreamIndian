import { json } from '../utils/response.js';
import { getPool } from '../pool/getPool.js';

export async function handleCatalogSeries({ extra, env }) {
  const offset = parseInt(extra?.search || '0', 10);
  const limit = 21;

  let items = await getPool('series', env) || [];

  // Force dummy data to break infinite loading and prove response works
  if (items.length === 0) {
    items = [
      { title: "Mirzapur", poster: "https://via.placeholder.com/300x450?text=Mirzapur" },
      { title: "Sacred Games", poster: "https://via.placeholder.com/300x450?text=Sacred+Games" },
      { title: "Paatal Lok", poster: "https://via.placeholder.com/300x450?text=Paatal+Lok" },
      { title: "The Family Man", poster: "https://via.placeholder.com/300x450?text=Family+Man" },
      { title: "Scam 1992", poster: "https://via.placeholder.com/300x450?text=Scam+1992" }
    ];
  }

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
    hasMore: slice.length === limit
  });
}