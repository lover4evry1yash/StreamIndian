export async function getPool(type, env) {
  console.log(`getPool called for type: ${type}`);

  const cacheKey = `${type}_pool`;
  let items = await env.CACHE.get(cacheKey, { type: 'json' }) || [];

  if (items.length === 0) {
    console.log(`Cache miss for ${type} - fetching from TMDB`);
    try {
      const apiKey = env.TMDB_KEY;
      if (!apiKey) throw new Error("TMDB_KEY missing");

      const language = "hi-IN";
      const region = "IN";
      const page = 1;

      let url = "";
      if (type === "movie") {
        url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=${language}&region=${region}&sort_by=popularity.desc&include_adult=false&page=${page}`;
      } else if (type === "series") {
        url = `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&language=${language}&region=${region}&sort_by=popularity.desc&include_adult=false&page=${page}`;
      }

      if (!url) throw new Error("Invalid type");

      const response = await fetch(url);
      if (!response.ok) throw new Error(`TMDB error: ${response.status}`);

      const data = await response.json();
      items = data.results.map(item => ({
        title: item.title || item.name,
        poster: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
        id: item.id
      }));

      console.log(`Fetched ${items.length} items from TMDB for ${type}`);

      await env.CACHE.put(cacheKey, JSON.stringify(items), { expirationTtl: 3600 });
    } catch (err) {
      console.error(`getPool error for ${type}:`, err.message);
      items = [];
    }
  } else {
    console.log(`Cache hit for ${type} - ${items.length} items`);
  }

  console.log(`getPool ${type} returned ${items.length} items`);
  return items;
}