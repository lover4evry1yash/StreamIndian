// Import your actual pool builders (adjust names if different)
// import { buildMoviePool } from "./buildMoviePool.js";
// import { buildSeriesPool } from "./buildSeriesPool.js";

export async function getPool(type, env) {
  console.log(`getPool called for type: ${type}`);

  let items = [];
  try {
    if (type === 'movie') {
      // Replace with your real movie pool logic, e.g.:
      // items = await buildMoviePool(env);
      // Or KV fetch: items = await env.KV.get('movie_pool', { type: 'json' }) || [];
      // For testing: items = [{ title: "Test Movie", poster: "https://example.com/poster.jpg" }];
    } else if (type === 'series') {
      // Replace with your real series pool logic
      // items = await buildSeriesPool(env);
      // Or KV fetch: items = await env.KV.get('series_pool', { type: 'json' }) || [];

      // Temporary dummy data if pool is empty (uncomment for testing)
      // items = [
      //   { title: "Mirzapur", poster: "https://image.tmdb.org/t/p/w500/example1.jpg" },
      //   { title: "Sacred Games", poster: "https://image.tmdb.org/t/p/w500/example2.jpg" },
      //   { title: "Paatal Lok", poster: "https://image.tmdb.org/t/p/w500/example3.jpg" },
      //   { title: "The Family Man", poster: "https://image.tmdb.org/t/p/w500/example4.jpg" },
      //   { title: "Scam 1992", poster: "https://image.tmdb.org/t/p/w500/example5.jpg" },
      //   // Add more as needed
      // ];
    }
  } catch (err) {
    console.error(`getPool error for ${type}:`, err);
  }

  console.log(`getPool ${type} returned ${items?.length || 0} items`);
  return items || [];
}