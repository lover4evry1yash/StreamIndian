import { tmdbFetch } from './client.js'

export async function tmdbTrendingSeries(env) {
  const data = await tmdbFetch(env, '/trending/tv/week')
  return data.results || []
}

export async function tmdbSeriesDetails(env, id) {
  return tmdbFetch(env, `/tv/${id}`, {
    append_to_response: 'credits,images'
  })
}

export async function tmdbSeasonDetails(env, id, season) {
  return tmdbFetch(env, `/tv/${id}/season/${season}`)
}

export async function tmdbDiscoverSeries(env, page = 1) {
  const data = await tmdbFetch(env, '/discover/tv', {
    page,
    sort_by: 'popularity.desc'
  })

  return data.results || []
}
