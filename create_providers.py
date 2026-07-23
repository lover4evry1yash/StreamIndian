import os

providers = {
    'tvdb': {
        'class': 'TVDBProvider',
        'id': 'tvdb',
        'name': 'TheTVDB',
        'caps': ['METADATA', 'TV_EPISODES', 'ARTWORK', 'SEARCH']
    },
    'anilist': {
        'class': 'AniListProvider',
        'id': 'anilist',
        'name': 'AniList',
        'caps': ['METADATA', 'ANIME', 'CHARACTERS', 'STUDIOS', 'SEARCH']
    },
    'fanart': {
        'class': 'FanartProvider',
        'id': 'fanart',
        'name': 'Fanart.tv',
        'caps': ['ARTWORK']
    },
    'rpdb': {
        'class': 'RPDBProvider',
        'id': 'rpdb',
        'name': 'Rating Poster Database',
        'caps': ['ARTWORK', 'RATINGS']
    },
    'mdblist': {
        'class': 'MDBListProvider',
        'id': 'mdblist',
        'name': 'MDBList',
        'caps': ['COLLECTIONS', 'RATINGS', 'SEARCH']
    },
    'trakt': {
        'class': 'TraktProvider',
        'id': 'trakt',
        'name': 'Trakt.tv',
        'caps': ['METADATA', 'RATINGS', 'TRENDING', 'RECOMMENDATIONS', 'WATCH_HISTORY', 'CONTINUE_WATCHING', 'USER_LISTS']
    }
}

template = """import { IProvider, ProviderContext, ProviderCapability } from '../types';

export class %s implements IProvider {
  public readonly id = '%s';
  public readonly name = '%s';
  public readonly version = '1.0.0';
  public readonly capabilities = [
%s
  ];

  public async initialize(context: ProviderContext): Promise<void> {
    // Placeholder
  }

  public async shutdown(): Promise<void> {
    // Placeholder
  }

  public async healthCheck(): Promise<boolean> {
    return true; // Placeholder
  }

  public reset(): void {
    // Placeholder
  }
}
"""

for folder, p in providers.items():
    caps_list = ",\n".join([f"    ProviderCapability.{c}" for c in p['caps']])
    content = template % (
        p['class'],
        p['id'],
        p['name'],
        caps_list
    )
    with open(f"src/core/providers/{folder}/{p['class']}.ts", "w") as f:
        f.write(content)
    with open(f"src/core/providers/{folder}/index.ts", "w") as f:
        f.write(f"export * from './{p['class']}';\n")

