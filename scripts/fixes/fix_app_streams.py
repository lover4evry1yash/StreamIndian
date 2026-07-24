content = open('src/App.tsx').read()

import re
content = re.sub(
    r"onClick={\(\) => handleStartPlayback\(heroItem, heroItem\.streams\[0\], 0\)}", 
    r"onClick={() => setStreamSelectionMedia({ media: heroItem, startPosition: 0 })}", 
    content
)
content = re.sub(
    r"<span>Watch Now \(\{heroItem\.streams\[0\]\.quality\}\)</span>", 
    r"<span>Watch Now</span>", 
    content
)

open('src/App.tsx', 'w').write(content)
