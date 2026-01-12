import { paginatePool } from "./common.js";
import { getPool } from "../pool/getPool.js";

export async function handleCatalogMovies({ skip = 0, limit = 20 }) {
  // 🔒 Deterministic pool
  const pool = await getPool("movie");

  const { slice } = paginatePool(pool, skip, limit);

  return {
    metas: slice.slice(0, limit).map((movie) => ({
      id: movie.id,           // 🔒 MUST be stable
      type: "movie",
      name: movie.name,
      poster: movie.poster,
      background: movie.background || movie.poster
    }))
  };
}
