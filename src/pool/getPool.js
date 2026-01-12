import { buildMoviePool } from "./buildMoviePool.js";
import { buildSeriesPool } from "./buildSeriesPool.js";

export async function getPool(type, env) {
  if (type === "movie") {
    return await buildMoviePool(env);
  }

  if (type === "series") {
    return await buildSeriesPool(env);
  }

  return [];
}
