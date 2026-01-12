import { paginatePool } from "./common.js";
import { getPool } from "../pool/getPool.js";

export async function handleCatalogMovies({ type, id, extra, env }) {
  const skip = Number(extra?.skip) || 0;
  const limit = Number(extra?.limit) || 20;

  const pool = await getPool("movie", env);
  const { slice } = paginatePool(pool, skip, limit);

  return {
    metas: slice.slice(0, limit).map(movie => ({
      id: movie.id,
      type: "movie",
      name: movie.name,
      poster: movie.poster
    }))
  };
}
