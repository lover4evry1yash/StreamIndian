import { createTmdbClient } from "../tmdb/client.js";

export async function buildMoviePool(env) {
  const tmdb = createTmdbClient(env);

  const data = await tmdb.movie.popular();

  return data.results.map(movie => ({
    id: `tmdb:movie:${movie.id}`,
    name: movie.title,
    poster: movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : null
  }));
}
