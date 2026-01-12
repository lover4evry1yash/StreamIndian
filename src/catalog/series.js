import { paginatePool } from "./common.js";
import { getSeriesPool } from "../pool/getPool.js";

/**
 * Series catalog handler
 * Pagination-safe. Deterministic. Stable.
 */
export async function seriesCatalog({ skip = 0, limit = 20 }) {
  // 🔒 MUST be deterministic
  const pool = await getSeriesPool();

  const { slice } = paginatePool(pool, skip, limit);

  return {
    metas: slice.slice(0, limit).map((series) => ({
      id: series.id,        // 🔒 MUST be globally stable
      type: "series",
      name: series.name,
      poster: series.poster,
      background: series.background || series.poster
    }))
  };
}
