import re

content = open('src/components/UniversalMediaDetailView.tsx').read()
content = content.replace("import { container } from '../core/DependencyInjection';", "import { container } from '../core/ServiceContainer';")
open('src/components/UniversalMediaDetailView.tsx', 'w').write(content)
