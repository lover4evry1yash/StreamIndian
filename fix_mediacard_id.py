import re

content = open('src/components/MediaCard.tsx').read()
content = content.replace("interface MediaCardProps {\n  media: MediaItem;", "interface MediaCardProps {\n  media: MediaItem;\n  rowId?: string;")
content = content.replace("const cardId = `media-card-${media.id}`;", "const cardId = rowId ? `${rowId}-media-${(media as any).mediaType || 'movie'}-${media.id}` : `media-card-${media.id}`;")
open('src/components/MediaCard.tsx', 'w').write(content)

content = open('src/components/MediaRow.tsx').read()
content = content.replace("index={index}", "index={index}\n              rowId={rowId}")
open('src/components/MediaRow.tsx', 'w').write(content)
