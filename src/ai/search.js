import { aiSuggest } from './client.js'
import { json } from '../utils/response.js'

export async function handleAISearch(request, env) {
  const url = new URL(request.url)
  const query = url.pathname.split('/').pop()

  const prompt = `
User searched: "${query}"

Suggest exact movie or series titles available on Indian OTT platforms.
Prefer dubbed/subbed versions.
For anime: Japanese audio, English subs only.
Return clean titles only.
`

  const text = await aiSuggest(env, prompt)
  if (!text) {
    return json({ metas: [] })
  }

  const titles = text
    .split('\n')
    .map(t => t.replace(/^[\-\d\.]+/, '').trim())
    .filter(Boolean)

  return json({
    metas: titles.map(t => ({
      id: t,
      name: t
    }))
  })
}
