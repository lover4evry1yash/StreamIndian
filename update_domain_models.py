import re

content = open('src/core/models/DomainModels.ts').read()

new_types = """export interface MediaReference {
  readonly id: string;
  readonly type: 'movie' | 'series' | 'episode' | 'anime';
  readonly title: string;
  readonly year?: number;
  readonly posterUrl?: string;
  readonly backdropUrl?: string;
  readonly progress?: number; // 0-100
  readonly lastWatched?: number;
  readonly externalIds?: ExternalIds;
}

export interface UserList {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly itemCount: number;
}
"""

if "MediaReference" not in content:
    content += "\n" + new_types
    open('src/core/models/DomainModels.ts', 'w').write(content)
