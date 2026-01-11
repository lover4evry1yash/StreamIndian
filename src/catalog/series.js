import { json } from '../utils/response.js'
import { getPool } from '../pool/getPool.js'

export async function handleCatalogSeries(request, env) {
  const url = new URL(request.url)
  const skip = parseInt(url.searchParams.get('skip') || '0', 10)
  const limit = 20

  const items = await getPool('series', env)

  const slice = items.slice(skip, skip + limit + 1)

  const metas = slice.slice(0, limit).map((item, index) => ({
    id: `streamindian:series:${skip + index}`,
    type: 'series',
    name: item.title,
    poster: item.poster
  }))

  return json({
    metas,
    hasMore: slice.length > limit
  })
}
