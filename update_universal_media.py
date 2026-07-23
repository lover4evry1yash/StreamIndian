import re

content = open('src/components/UniversalMediaDetailView.tsx').read()
content = content.replace("import { FocusItem } from './FocusItem';", "import { FocusItem } from './FocusItem';\nimport { LazyImage } from './LazyImage';")

content = content.replace("<img src={artwork.logo.url} alt={media.title} className=\"max-h-32 object-contain\" />", "<LazyImage src={artwork.logo.url} alt={media.title} className=\"max-h-32 object-contain\" priority=\"high\" />")
content = content.replace("<img src={ep.artwork.posters[0].url} alt={ep.title} className=\"w-full h-full object-cover\" />", "<LazyImage src={ep.artwork.posters[0].url} alt={ep.title} className=\"w-full h-full object-cover\" />")
content = content.replace("<img src={person.profileImage} alt={person.name} className=\"w-full h-full object-cover\" />", "<LazyImage src={person.profileImage} alt={person.name} className=\"w-full h-full object-cover\" />")
content = content.replace("<img src={artwork.poster.url} alt={media.title} className=\"w-full h-auto object-cover\" />", "<LazyImage src={artwork.poster.url} alt={media.title} className=\"w-full h-auto object-cover\" priority=\"high\" />")

open('src/components/UniversalMediaDetailView.tsx', 'w').write(content)
