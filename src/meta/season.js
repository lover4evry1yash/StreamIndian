import { json } from '../utils/response.js'
import { tmdbSeasonDetails } from '../tmdb/series.js'

export async function handleMetaSeason({ params }, env) {
  const data = await tmdbSeasonDetails(env, params.id, params.season)

  const episodes = (data.episodes || []).map(e => ({
    id: `streamindian:series:${params.id}:${params.season}:${e.episode_number}`,
    title: e.name,
    season: e.season_number,
    episode: e.episode_number,
    released: e.air_date
  }))

  return json({
    meta: {
      id: `streamindian:series:${params.id}:season:${params.season}`,
      type: 'season',
      name: `Season ${params.season}`,
      videos: episodes
    }
  })
}
