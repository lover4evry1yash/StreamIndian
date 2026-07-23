content = open('src/core/providers/types.ts').read()

import_add = "import { Rating } from '../models/DomainModels';"
if "Rating " not in content and "Rating," not in content:
    content = content.replace("import { Movie, Series, Episode, Anime, MediaReference, UserList } from '../models/DomainModels';", "import { Movie, Series, Episode, Anime, MediaReference, UserList, Rating } from '../models/DomainModels';")

if "export interface IRatingsProvider" not in content:
    interfaces = """
export interface IRatingsProvider extends IProvider {
  getRatings(mediaId: string, type: 'movie' | 'series', externalIds?: Record<string, string>): Promise<Rating[]>;
}
"""
    content += interfaces
    open('src/core/providers/types.ts', 'w').write(content)
