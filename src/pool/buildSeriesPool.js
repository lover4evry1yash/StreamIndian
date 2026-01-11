import { tmdbFetch } from '../tmdb/client.js'

export async function buildSeriesPool(env) {
  const pages = [1, 2, 3, 4, 5]
  const pool = []

  for (const page of pages) {
    const data = await tmdbFetch(env, '/discover/tv', {
      page,
      sort_by: 'popularity.desc'
    })

    for (const s of data.results || []) {
      pool.push({
        title: s.name,
        poster: s.poster_path
          ? `https://image.tmdb.org/t/p/w500${s.poster_path}`
          : null
      })
    }
  }

  return pool
}
