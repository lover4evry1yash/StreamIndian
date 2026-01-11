import { tmdbFetch } from '../tmdb/client.js'

export async function buildMoviePool(env) {
  const pages = [1, 2, 3, 4, 5] // ~100 movies to start
  const pool = []

  for (const page of pages) {
    const data = await tmdbFetch(env, '/discover/movie', {
      page,
      sort_by: 'popularity.desc',
      include_adult: false
    })

    for (const m of data.results || []) {
      pool.push({
        title: m.title,
        poster: m.poster_path
          ? `https://image.tmdb.org/t/p/w500${m.poster_path}`
          : null
      })
    }
  }

  return pool
}
