import { json } from '../utils/response.js'
import { paginate, normalizeMeta } from './common.js'
import { tmdbTrendingSeries } from '../tmdb/series.js'

export async function handleCatalogSeries(request, env) {
  const url = new URL(request.url)
  const skip = parseInt(url.searchParams.get('skip') || '0', 10)

  const items = await tmdbTrendingSeries(env)
  const page = paginate(items, skip)

  return json({
    metas: page.metas.map(i => normalizeMeta(i, 'series'))
  })
}
