import { buildMoviePool } from "./buildMoviePool.js";
import { buildSeriesPool } from "./buildSeriesPool.js";

/**
 * Cloudflare-safe pool getter
 * Pools are built lazily per request
 */
export async function getPool(type) {
  try {
    if (type === "movie") {
      const pool = await buildMoviePool();
      return Array.isArray(pool) ? pool : [];
    }

    if (type === "series") {
      const pool = await buildSeriesPool();
      return Array.isArray(pool) ? pool : [];
    }

    return [];
  } catch (err) {
    console.error("getPool error:", err);
    return [];
  }
}
