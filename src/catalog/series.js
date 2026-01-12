import { paginatePool } from "./common.js";
import { getPool } from "../pool/getPool.js";

export async function handleCatalogSeries({ skip = 0, limit = 20 }) {
  // 🔒 Deterministic pool
  const pool = await getPool("series");

  const { slice } = paginatePool(pool, skip, limit);

  return {
    metas: slice.slice(0, limit).map((series) => ({
      id: series.id,         // 🔒 MUST be stable
      type: "series",
      name: series.name,
      poster: series.poster,
      background: series.background || series.poster
    }))
  };
}
