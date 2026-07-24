content = open('src/core/Bootstrap.ts').read()

new_stremio = """
      const stremioProvider = new StremioProvider();
      stremioProvider.addAddonUrl('https://torrentio.strem.fun/manifest.json');
      sourceManager.registerProvider(stremioProvider);
"""

import re
content = re.sub(r"      sourceManager\.registerProvider\(new StremioProvider\(\)\);", new_stremio.strip(), content)

open('src/core/Bootstrap.ts', 'w').write(content)
