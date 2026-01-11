import { json } from '../utils/response.js'
import { tmdbDiscoverSeries } from '../tmdb/series.js'
import { normalizeMeta } from './common.js'

const LIMIT = 20

export async function handleCatalogSeries(request, env) {
  const url = new URL(request.url)
  const skip = Number(url.searchParams.get('skip') || 0)

  const page = Math.floor(skip / LIMIT) + 1
  const items = await tmdbDiscoverSeries(env, page)

  return json({
    metas: items.map(i => normalizeMeta(i, 'series'))
  })
}
