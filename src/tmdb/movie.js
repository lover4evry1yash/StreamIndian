import { tmdbFetch } from './client.js'

export async function tmdbTrendingMovies(env) {
  const data = await tmdbFetch(env, '/trending/movie/week')
  return data.results || []
}

export async function tmdbMovieDetails(env, id) {
  return tmdbFetch(env, `/movie/${id}`, {
    append_to_response: 'credits,images,release_dates'
  })
}
