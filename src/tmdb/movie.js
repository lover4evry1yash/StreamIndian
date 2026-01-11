import { json } from '../utils/response.js'
import { tmdbDiscoverMovies } from '../tmdb/movie.js'
import { normalizeMeta } from './common.js'

const LIMIT = 20

export async function handleCatalogMovies(request, env) {
  const url = new URL(request.url)
  const skip = Number(url.searchParams.get('skip') || 0)

  const page = Math.floor(skip / LIMIT) + 1
  const items = await tmdbDiscoverMovies(env, page)

  return json({
    metas: items.map(i => normalizeMeta(i, 'movie'))
  })
}
