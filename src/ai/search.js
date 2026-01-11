import { aiSuggest } from './client.js'

export async function aiSearch(env, query) {
  const prompt = `
User searched: "${query}"

Suggest exact movie or series titles available on Indian OTT platforms.
Prefer dubbed/subbed versions.
For anime: Japanese audio, English subs only.
Return clean titles only.
`

  const text = await aiSuggest(env, prompt)
  if (!text) return []

  return text
    .split('\n')
    .map(t => t.replace(/^[\-\d\.]+/, '').trim())
    .filter(Boolean)
}
