content = open('src/core/providers/types.ts').read()

import_add = "import { Movie, Series, Episode, Anime, MediaReference, UserList } from '../models/DomainModels';"
content = content.replace("import { Movie, Series, Episode, Anime } from '../models/DomainModels';", import_add)

if "export interface IPersonalizationProvider" not in content:
    interfaces = """
export interface IPersonalizationProvider extends IProvider {
  getTrending?(type: 'movie' | 'series'): Promise<MediaReference[]>;
  getRecommendations?(type: 'movie' | 'series', id?: string): Promise<MediaReference[]>;
  getWatchHistory?(): Promise<MediaReference[]>;
  getContinueWatching?(): Promise<MediaReference[]>;
  getUserLists?(): Promise<UserList[]>;
  getListItems?(listId: string): Promise<MediaReference[]>;
}

export interface ICollectionProvider extends IProvider {
  getCollection(id: string): Promise<MediaReference[]>;
  getTopRated?(type: 'movie' | 'series'): Promise<MediaReference[]>;
  getPopular?(type: 'movie' | 'series'): Promise<MediaReference[]>;
}
"""
    content += interfaces
    open('src/core/providers/types.ts', 'w').write(content)
