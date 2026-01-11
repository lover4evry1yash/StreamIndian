export function allowStream(stream, type) {
  const name = (stream.name || '').toLowerCase()

  if (type === 'anime') {
    return name.includes('japanese') || name.includes('eng')
  }

  return true
}
