import { json } from '../utils/response.js'
import { tmdbMovieDetails } from '../tmdb/movie.js'
import { normalizeMovieMeta } from './normalize.js'

export async function handleMetaMovie({ params }, env) {
  const data = await tmdbMovieDetails(env, params.id)
  return json({ meta: normalizeMovieMeta(data) })
}
