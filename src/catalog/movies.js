import { json } from '../utils/response.js'
import { getPool } from '../pool/getPool.js'

export async function handleCatalogMovies(request, env) {
  const url = new URL(request.url)
  const skip = parseInt(url.searchParams.get('skip') || '0', 10)
  const limit = 20

  const items = await getPool('movie', env)

  const slice = items.slice(skip, skip + limit + 1)
  const metas = slice.slice(0, limit).map((item, index) => ({
    id: `streamindian:movie:${skip + index}`,
    type: 'movie',
    name: item.title,
    poster: item.poster
  }))

  return json({ const slice = items.slice(skip, skip + limit + 1)

const metas = slice.slice(0, limit).map((item, index) => ({
  id: `streamindian:movie:${skip + index}`,
  type: 'movie',
  name: item.title,
  poster: item.poster
}))

return json({
  metas,
  hasMore: slice.length > limit
})
 })
}
