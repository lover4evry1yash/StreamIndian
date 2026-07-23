content = open('src/core/Bootstrap.ts').read()

import re
# First, remove DirectResolver from wherever it wrongly ended up
content = content.replace("  DirectResolver,\n", "")

# Now add it to the correct streams import
content = re.sub(r"(import\s*{[\s\S]*?)(\n} from '\./streams';)", r"\1,\n  DirectResolver\2", content)

open('src/core/Bootstrap.ts', 'w').write(content)
