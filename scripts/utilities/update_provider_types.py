import re

content = open('src/core/providers/types.ts').read()

new_capabilities = """  ARTWORK = 'ARTWORK',
  RATINGS = 'RATINGS',
  TRENDING = 'TRENDING',
  RECOMMENDATIONS = 'RECOMMENDATIONS',
  COLLECTIONS = 'COLLECTIONS',
  CHARACTERS = 'CHARACTERS',
  STUDIOS = 'STUDIOS',
  ANIME = 'ANIME',
  TV_EPISODES = 'TV_EPISODES',
  WATCH_HISTORY = 'WATCH_HISTORY',
  CONTINUE_WATCHING = 'CONTINUE_WATCHING',
  USER_LISTS = 'USER_LISTS',
  STATISTICS = 'STATISTICS',
}"""

content = content.replace("  DRM = 'DRM',\n}", "  DRM = 'DRM',\n" + new_capabilities)

new_health = """export interface ProviderHealth {
  status: ProviderHealthStatus;
  lastSuccess: number;
  lastFailure: number;
  averageResponseTime: number;
  failureCount: number;
  successCount: number;
  timeouts: number;
}"""

content = re.sub(r'export interface ProviderHealth \{[^}]+\}', new_health, content)

new_types = """
export interface ProviderCredential {
  id: string;
  value: string;
  type: 'secret' | 'public';
  expiresAt?: number;
}

export interface ProviderStatistics {
  requests: number;
  successes: number;
  failures: number;
  timeouts: number;
  averageLatencyMs: number;
}

export interface ProviderMergePolicy {
  overview: string[];
  episodes: string[];
  anime: string[];
  artwork: string[];
  poster: string[];
  ratings: string[];
  collections: string[];
  [key: string]: string[] | undefined;
}
"""

content = content + new_types

open('src/core/providers/types.ts', 'w').write(content)
