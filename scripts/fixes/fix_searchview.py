import re

content = open('src/components/SearchView.tsx').read()
content = content.replace(
    "posterUrl: item.images?.find((img: any) => img.type === 'poster')?.url || '',",
    "posterUrl: item.artwork?.posters?.[0]?.url || '',"
)
content = content.replace(
    "backdropUrl: item.images?.find((img: any) => img.type === 'backdrop')?.url || '',",
    "backdropUrl: item.artwork?.backdrops?.[0]?.url || '',"
)
open('src/components/SearchView.tsx', 'w').write(content)
