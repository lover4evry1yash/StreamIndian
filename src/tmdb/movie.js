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

export async function tmdbDiscoverMovies(env, page = 1) {
  const data = await tmdbFetch(env, '/discover/movie', {
    page,
    sort_by: 'popularity.desc',
    with_original_language: 'hi|ta|te|ml|kn|en',
    region: env.DEFAULT_COUNTRY || 'IN'
  })

  return data.results || []
}
