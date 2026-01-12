import { json } from '../utils/response.js';
import { getPool } from '../pool/getPool.js';

export async function handleCatalogSeries({ extra, env }) {
  const offset = parseInt(extra?.search || '0', 10);
  const limit = 21;

  let items = await getPool('series', env) || [];

  // Temporary fallback dummy data if pool empty (remove later once TMDB works)
  if (items.length === 0) {
    items = [
      { title: "Mirzapur", poster: "https://image.tmdb.org/t/p/w500/8Uu0t4l4JTu3fI3s3kR3p4wG0eE.jpg" },
      { title: "Sacred Games", poster: "https://image.tmdb.org/t/p/w500/6q3w9v6U9j4q8j9k5q2q2q2q2q2q.jpg" },
      { title: "Paatal Lok", poster: "https://image.tmdb.org/t/p/w500/5q2q2q2q2q2q2q2q2q2q2q2q2q.jpg" },
      { title: "The Family Man", poster: "https://image.tmdb.org/t/p/w500/7q7q7q7q7q7q7q7q7q7q7q7q7q.jpg" },
      { title: "Scam 1992", poster: "https://image.tmdb.org/t/p/w500/9q9q9q9q9q9q9q9q9q9q9q9q9q.jpg" },
      // Add 10-20 more if needed for testing scroll
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