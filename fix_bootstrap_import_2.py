content = open('src/core/Bootstrap.ts').read()
content = content.replace("  DirectResolver,\n  container }", "  container }")
open('src/core/Bootstrap.ts', 'w').write(content)
