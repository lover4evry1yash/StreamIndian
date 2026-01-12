import { paginatePool } from "./common.js";
import { getPool } from "../pool/getPool.js";

export async function handleCatalogMovies({ skip = 0, limit = 20 }) {
  let pool = [];

  try {
    pool = await getPool("movie");
  } catch (e) {
    console.error("Movie pool error:", e);
  }

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
