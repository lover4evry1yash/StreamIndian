export async function getPool(type, env) {
  console.log(`getPool called for type: ${type}`);

  const cacheKey = `${type}_pool`;
  let items = await env.KV.get(cacheKey, { type: 'json' }) || [];

  if (items.length === 0) {
    console.log(`Pool cache miss for ${type} - fetching from TMDB`);
    try {
      const apiKey = env.TMDB_KEY; // Changed from TMDB_API_KEY - check if name matches dashboard
      const language = 'hi-IN';
      const region = 'IN';
      const page = 1;
      const limit = 3; // Fetch 3 pages (60 items, but limit to 50 for performance)

      let urlBase = '';
      if (type === 'movie') {
        urlBase = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=${language}&region=${region}&sort_by=popularity.desc&include_adult=false&include_video=false&with_original_language=hi|ta|te|ml|kn`;
      } else if (type === 'series') {
        urlBase = `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&language=${language}&region=${region}&sort_by=popularity.desc&include_adult=false&with_original_language=hi|ta|te|ml|kn`;
      }

      if (!urlBase) {
        throw new Error('Invalid type');
      }

      items = [];
      for (let p = 1; p <= limit; p++) {
        const url = `${urlBase}&page=${p}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`TMDB fetch failed: ${response.status}`);
        }
        const data = await response.json();
        items = items.concat(data.results.map(item => ({
          title: item.title || item.name,
          poster: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
          id: item.id
        })));
      }

      console.log(`Fetched ${items.length} items from TMDB for ${type}`);

      // Cache for 1 hour (3600 seconds)
      await env.KV.put(cacheKey, JSON.stringify(items), { expirationTtl: 3600 });
    } catch (err) {
      console.error(`getPool error for ${type}:`, err.message);
      items = []; // Fallback
    }
  } else {
    console.log(`Pool cache hit for ${type} - ${items.length} items`);
  }

  console.log(`getPool ${type} returned ${items.length} items`);
  return items;
}