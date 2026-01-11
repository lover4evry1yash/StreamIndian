import { json } from '../utils/response.js'
import { torboxStreams } from './torbox.js'
import { rankStreams } from './ranking.js'
import { allowStream } from './language.js'

export async function handleStream({ params }, env) {
  const id = params.id
  const type = params.type

  const streams = await torboxStreams(env, id)
  const filtered = streams.filter(s => allowStream(s, type))
  const ranked = rankStreams(filtered)

  return json({
    streams: ranked.map(s => ({
      name: s.name,
      infoHash: s.infoHash
    }))
  })
}
