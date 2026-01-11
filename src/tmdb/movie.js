import { tmdbFetch } from './client.js'

export async function tmdbTrendingMovies(env) {
  const data = await tmdbFetch(env, '/trending/movie/week', {
    region: env.DEFAULT_COUNTRY || 'IN'
  })
  return data.results || []
}

export async function tmdbMovieDetails(env, id) {
  return tmdbFetch(env, `/movie/${id}`, {
    append_to_response: 'credits,images,release_dates',
    region: env.DEFAULT_COUNTRY || 'IN'
  })
}

export async function tmdbDiscoverMovies(env, page = 1) {
  const data = await tmdbFetch(env, '/discover/movie', {
    page,
    sort_by: 'popularity.desc',
    include_adult: false
  })
  return data.results || []
}
