export async function torboxStreams(env, query) {
  if (env.ENABLE_TORBOX !== 'true') return []

  const url = new URL('https://api.torbox.app/v1/search')
  url.searchParams.set('query', query)
  url.searchParams.set('apikey', env.TORBOX_KEY)

  const res = await fetch(url.toString())
  if (!res.ok) return []

  const data = await res.json()
  return (data.results || []).map(r => ({
    name: r.name,
    infoHash: r.hash,
    size: r.size
  }))
}
