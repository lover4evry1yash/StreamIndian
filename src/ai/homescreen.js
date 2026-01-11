import { aiSuggest } from './client.js'
import { json } from '../utils/response.js'

async function aiHome(env) {
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

  await env.CACHE.put(cacheKey, JSON.stringify(titles), {
    expirationTtl: 21600
  })

  return titles
}

export async function handleAIHome(request, env) {
  const titles = await aiHome(env)

  return json({
    metas: titles.map(t => ({
      id: t,
      name: t
    }))
  })
}
