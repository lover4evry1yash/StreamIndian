import { json } from '../utils/response.js'
import { paginate, normalizeMeta } from './common.js'
import { tmdbTrendingMovies } from '../tmdb/movie.js'

export async function handleCatalogMovies(request, env) {
  const url = new URL(request.url)
  const skip = parseInt(url.searchParams.get('skip') || '0', 10)

  const items = await tmdbTrendingMovies(env)
  const page = paginate(items, skip)

  return json({
    metas: page.metas.map(i => normalizeMeta(i, 'movie'))
  })
}
