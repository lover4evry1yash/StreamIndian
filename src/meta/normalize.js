export function normalizeMovieMeta(data) {
  return {
    id: `streamindian:movie:${data.id}`,
    type: 'movie',
    name: data.title,
    poster: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null,
    background: data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : null,
    description: data.overview,
    year: data.release_date?.split('-')[0],
    genres: data.genres?.map(g => g.name) || [],
    runtime: data.runtime ? data.runtime * 60 : undefined
  }
}

export function normalizeSeriesMeta(data) {
  return {
    id: `streamindian:series:${data.id}`,
    type: 'series',
    name: data.name,
    poster: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null,
    background: data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : null,
    description: data.overview,
    year: data.first_air_date?.split('-')[0],
    genres: data.genres?.map(g => g.name) || []
  }
}
