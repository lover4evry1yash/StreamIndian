import re

content = open('src/App.tsx').read()

# Fix TVNavbar wrapper
content = content.replace("<Suspense fallback={<div />}>\n        <TVNavbar", "<TVNavbar")
# It seems there is a missing close tag because of this. Let's just remove the `<Suspense fallback={<div />}>` before TVNavbar
# Wait, I didn't close it, so it's swallowing everything.

content = content.replace("        </Suspense>\n        </Suspense>", "        </Suspense>")

open('src/App.tsx', 'w').write(content)
