import { json } from '../utils/response.js'
import { tmdbSeriesDetails } from '../tmdb/series.js'
import { normalizeSeriesMeta } from './normalize.js'

export async function handleMetaSeries({ params }, env) {
  const data = await tmdbSeriesDetails(env, params.id)
  return json({ meta: normalizeSeriesMeta(data) })
}
