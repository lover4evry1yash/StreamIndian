export function rankStreams(streams) {
  return streams.sort((a, b) => {
    const qa = qualityScore(a)
    const qb = qualityScore(b)
    return qb - qa
  })
}

function qualityScore(stream) {
  const name = (stream.name || '').toLowerCase()
  if (name.includes('2160') || name.includes('4k')) return 5
  if (name.includes('1080')) return 4
  if (name.includes('720')) return 3
  return 1
}
