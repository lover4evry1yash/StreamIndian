import { paginatePool } from "./common.js";
import { getMoviePool } from "../pool/getPool.js";

/**
 * Movie catalog handler
 * Pagination-safe. Deterministic. Stable.
 */
export async function moviesCatalog({ skip = 0, limit = 20 }) {
  // 🔒 MUST be deterministic
  const pool = await getMoviePool();

  const { slice } = paginatePool(pool, skip, limit);

  return {
    metas: slice.slice(0, limit).map((movie) => ({
      id: movie.id,          // 🔒 MUST be globally stable
      type: "movie",
      name: movie.name,
      poster: movie.poster,
      background: movie.background || movie.poster
    }))
  };
}
