export function normalizeMeta(item, type) {
  return {
    id: `streamindian:${type}:${item.id}`,
    type,
    name: item.title || item.name,
    poster: item.poster_path
      ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
      : null,
    background: item.backdrop_path
      ? `https://image.tmdb.org/t/p/original${item.backdrop_path}`
      : null
  }
}
