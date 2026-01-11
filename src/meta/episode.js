import { json } from '../utils/response.js'

export async function handleMetaEpisode({ params }) {
  return json({
    meta: {
      id: `streamindian:series:${params.id}:${params.season}:${params.episode}`,
      type: 'episode',
      season: Number(params.season),
      episode: Number(params.episode)
    }
  })
}
