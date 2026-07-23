import re

content = open('src/components/MediaCard.tsx').read()

content = content.replace("import { FocusItem } from './FocusItem';", "import { FocusItem } from './FocusItem';\nimport { LazyImage } from './LazyImage';")
content = content.replace("index: number;", "index: number;\n  isVisible?: boolean;")

img_old = """<img
          src={media.posterUrl}
          alt={media.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />"""

img_new = """<LazyImage
          src={media.posterUrl}
          alt={media.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />"""

content = content.replace(img_old, img_new)
open('src/components/MediaCard.tsx', 'w').write(content)
