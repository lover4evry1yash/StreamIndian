import { buildMoviePool } from './buildMoviePool.js'
import { buildSeriesPool } from './buildSeriesPool.js'

export async function getPool(type, env) {
  const key = `pool:${type}`

  const cached = await env.CACHE.get(key, 'json')
  if (cached) return cached

  const pool =
    type === 'movie'
      ? await buildMoviePool(env)
      : await buildSeriesPool(env)

  await env.CACHE.put(key, JSON.stringify(pool), {
    expirationTtl: 6 * 3600 // 6 hours
  })

  return pool
}
