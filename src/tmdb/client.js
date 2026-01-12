const TMDB_BASE = "https://api.themoviedb.org/3";

export function createTmdbClient(env) {
  const API_KEY = env.TMDB_KEY;

  if (!API_KEY) {
    throw new Error("TMDB_KEY missing in Cloudflare env");
  }

  async function request(path, params = {}) {
    const url = new URL(TMDB_BASE + path);
    url.searchParams.set("api_key", API_KEY);

    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) url.searchParams.set(k, v);
    }

    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error(`TMDB ${res.status}: ${path}`);
    }

    return res.json();
  }

  return {
    movie: {
      popular: () => request("/movie/popular"),
    },
    series: {
      popular: () => request("/tv/popular"),
    }
  };
}
