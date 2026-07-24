import re

content = open('src/App.tsx').read()
content = content.replace("import { FocusItem } from './components/FocusItem';", "import { FocusItem } from './components/FocusItem';\nimport { LazyImage } from './components/LazyImage';")

img_old = """                <img
                  src={heroItem.backdropUrl || heroItem.posterUrl}
                  alt={heroItem.title}
                  className="absolute inset-0 w-full h-full object-cover object-top opacity-50 scale-105 filter brightness-90"
                />"""

img_new = """                <LazyImage
                  src={heroItem.backdropUrl || heroItem.posterUrl}
                  alt={heroItem.title}
                  className="absolute inset-0 w-full h-full object-cover object-top opacity-50 scale-105 filter brightness-90"
                  priority="high"
                />"""

content = content.replace(img_old, img_new)
open('src/App.tsx', 'w').write(content)
