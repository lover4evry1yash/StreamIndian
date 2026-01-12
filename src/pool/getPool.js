export async function getPool(type, env) {
  console.log(`getPool called for type: ${type}`);

  let items = [];
  try {
    // Your real pool logic here (e.g., KV fetch or TMDB build)
    // Example: items = await env.KV.get(`${type}_pool`, { type: 'json' }) || [];
    // If using build functions: items = await buildPool(type, env);

    // For now, return [] for movie (since it works) and dummy for series test
    if (type === 'series') {
      items = []; // Replace with real logic later
    }
  } catch (err) {
    console.error(`getPool error for ${type}:`, err);
  }

  console.log(`getPool ${type} returned ${items.length} items`);
  return items;
}