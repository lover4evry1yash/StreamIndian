import re

content = open('src/core/Bootstrap.ts').read()

imports = """import { TMDBProvider } from './providers/tmdb';
import { TVDBProvider } from './providers/tvdb';
import { AniListProvider } from './providers/anilist';
import { FanartProvider } from './providers/fanart';
import { RPDBProvider } from './providers/rpdb';
import { MDBListProvider } from './providers/mdblist';
import { TraktProvider } from './providers/trakt';"""

content = content.replace("import { TMDBProvider } from './providers/tmdb';", imports)

registrations = """      const tmdbProvider = new TMDBProvider();
      providerManager.register(tmdbProvider, ProviderPriority.HIGH);

      providerManager.register(new TVDBProvider(), ProviderPriority.NORMAL);
      providerManager.register(new AniListProvider(), ProviderPriority.NORMAL);
      providerManager.register(new FanartProvider(), ProviderPriority.NORMAL);
      providerManager.register(new RPDBProvider(), ProviderPriority.NORMAL);
      providerManager.register(new MDBListProvider(), ProviderPriority.NORMAL);
      providerManager.register(new TraktProvider(), ProviderPriority.NORMAL);
"""

content = content.replace("      const tmdbProvider = new TMDBProvider();\n      providerManager.register(tmdbProvider, ProviderPriority.HIGH);", registrations)

open('src/core/Bootstrap.ts', 'w').write(content)
