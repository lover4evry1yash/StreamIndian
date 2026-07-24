content = open('src/App.tsx').read()

import_statement = "import { StreamSelectionView } from './components/StreamSelectionView';\n"
content = content.replace("import { SpatialFocusProvider } from './core/navigation';", "import { SpatialFocusProvider } from './core/navigation';\n" + import_statement)

state = """
  const [streamSelectionMedia, setStreamSelectionMedia] = useState<{
    media: MediaItem;
    startPosition: number;
  } | null>(null);
"""
content = content.replace("  const [activePlayback, setActivePlayback] = useState<{", state + "\n  const [activePlayback, setActivePlayback] = useState<{")

# handle StartPlayback needs to not use streams[0] anymore.
# Actually handleStartPlayback already takes `stream` parameter, so no change needed there!

# Update onPlay logic
new_onplay = """
            onPlay={(media, startPosition) => {
              setStreamSelectionMedia({ media, startPosition: startPosition || 0 });
            }}
"""
import re
content = re.sub(r"onPlay={\(media, startPosition\) => \{[^\}]+\}\}", new_onplay.strip(), content)

# Inject the StreamSelectionView before TVPlayer
stream_selection = """
        {streamSelectionMedia && (
          <StreamSelectionView
            media={streamSelectionMedia.media}
            onClose={() => setStreamSelectionMedia(null)}
            onStreamSelected={(stream) => {
              handleStartPlayback(streamSelectionMedia.media, stream, streamSelectionMedia.startPosition);
              setStreamSelectionMedia(null);
            }}
          />
        )}
"""
content = content.replace("{/* Fullscreen TV Player */}", stream_selection + "\n        {/* Fullscreen TV Player */}")

open('src/App.tsx', 'w').write(content)
