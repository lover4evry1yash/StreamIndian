content = open('src/components/StreamSelectionView.tsx').read()

import re

filter_code = """
  let displayStreams = streams;
  if (settings.streams?.hideUncached) {
      displayStreams = streams.filter(s => s.readiness !== PlaybackReadiness.DEBRID_REQUIRED && s.readiness !== PlaybackReadiness.DIRECT_TORRENT);
  }

  const directStreams = displayStreams.filter(s => s.readiness === PlaybackReadiness.DIRECT || !s.readiness);
  const torrentStreams = displayStreams.filter(s => s.readiness === PlaybackReadiness.DEBRID_CACHED || s.readiness === PlaybackReadiness.DEBRID_REQUIRED || s.readiness === PlaybackReadiness.DIRECT_TORRENT);
"""

content = re.sub(r"  const directStreams = streams\.filter.*?\n  const torrentStreams = streams\.filter.*?\n", filter_code, content)

open('src/components/StreamSelectionView.tsx', 'w').write(content)
