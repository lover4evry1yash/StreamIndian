import { createTmdbClient } from "../tmdb/client.js";

export async function buildSeriesPool(env) {
  const tmdb = createTmdbClient(env);

  const data = await tmdb.series.popular();

  return data.results.map(series => ({
    id: `tmdb:series:${series.id}`,
    name: series.name,
    poster: series.poster_path
      ? `https://image.tmdb.org/t/p/w500${series.poster_path}`
      : null
  }));
}
