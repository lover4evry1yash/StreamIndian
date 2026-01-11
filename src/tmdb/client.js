export async function tmdbFetch(env, path, params = {}, options = {}) {
  const url = new URL('https://api.themoviedb.org/3' + path)

  url.searchParams.set('api_key', env.TMDB_KEY)

  // ✅ Only apply region when explicitly allowed
  if (options.useRegion) {
    url.searchParams.set('region', env.DEFAULT_COUNTRY || 'IN')
  }

  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) {
      url.searchParams.set(k, v)
    }
  }

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error('TMDB error')

  return res.json()
}
