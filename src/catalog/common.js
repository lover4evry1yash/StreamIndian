import { json } from '../utils/response.js'

const LIMIT = 20

export function paginate(items, skip) {
  const slice = items.slice(skip, skip + LIMIT + 1)
  return {
    metas: slice.slice(0, LIMIT),
    hasMore: slice.length > LIMIT
  }
}

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
