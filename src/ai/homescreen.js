import { aiSuggest } from './client.js'
import { json } from '../utils/response.js'

export async function aiHome(env) {
  const cacheKey = 'ai:home'
  const cached = await env.CACHE.get(cacheKey)
  if (cached) return JSON.parse(cached)

  const prompt = `
Suggest trending Indian movies and series across:
Hindi, Tamil, Telugu, Malayalam.
Also include international trending OTT titles in India.
Return only titles, no descriptions.
`

  const text = await aiSuggest(env, prompt)
  if (!text) return []

  const titles = text
    .split('\n')
    .map(t => t.replace(/^[\-\d\.]+/, '').trim())
    .filter(Boolean)
    .slice(0, Number(env.MAX_RESULTS || 50))

  await env.CACHE.put(cacheKey, JSON.stringify(titles), { expirationTtl: 21600 })
  return titles
}
