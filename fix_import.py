content = open('src/core/providers/types.ts').read()
content = content.replace("import { Movie, Series, Episode } from '../models/DomainModels';", "import { Movie, Series, Episode, Anime } from '../models/DomainModels';")
open('src/core/providers/types.ts', 'w').write(content)
