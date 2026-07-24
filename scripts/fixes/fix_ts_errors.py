import re

content = open('src/components/LazyImage.tsx').read()
content = content.replace("priority = 'low',", "priority = 'low' as 'high' | 'low',")
content = content.replace("artworkManager.preloadImage(src, priority)", "artworkManager.preloadImage(src, priority as 'high' | 'low')")
open('src/components/LazyImage.tsx', 'w').write(content)

content = open('src/components/MediaRow.tsx').read()
content = content.replace("renderItem={(media,", "renderItem={(media: MediaItem,")
open('src/components/MediaRow.tsx', 'w').write(content)
