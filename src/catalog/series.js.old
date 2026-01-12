import { paginatePool } from "./common.js";
import { getPool } from "../pool/getPool.js";

export async function handleCatalogSeries({ type, id, extra, env }) {
  const skip = Number(extra?.skip) || 0;
  const limit = Number(extra?.limit) || 20;

  const pool = await getPool("series", env);
  const { slice } = paginatePool(pool, skip, limit);

  return {
    metas: slice.slice(0, limit).map(series => ({
      id: series.id,
      type: "series",
      name: series.name,
      poster: series.poster
    }))
  };
}
