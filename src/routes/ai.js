import { json } from '../utils/response.js'
import { aiHome } from '../ai/home.js'
import { aiSearch } from '../ai/search.js'

export async function aiCatalog({ query }, env) {
  if (query?.search) {
    const titles = await aiSearch(env, query.search)
    return json({ metas: titles.map(t => ({ id: t, name: t })) })
  }

  const titles = await aiHome(env)
  return json({ metas: titles.map(t => ({ id: t, name: t })) })
}
