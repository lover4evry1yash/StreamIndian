const fs = require('fs');
let content = fs.readFileSync('src/core/storage/SettingsManager.ts', 'utf8');

// Update AppSettings interface
content = content.replace(/streams: \{/, 
`providers: {
    [providerId: string]: {
      enabled: boolean;
      apiKey?: string;
      username?: string;
      clientId?: string;
      clientSecret?: string;
      accessToken?: string;
    };
  };
  streams: {`);

content = content.replace(/stremioAddons: \['https:\/\/torrentio\.strem\.fun\/manifest\.json'\]\n  \}\n\};/, 
`stremioAddons: ['https://torrentio.strem.fun/manifest.json']
  },
  providers: {}
};`);

fs.writeFileSync('src/core/storage/SettingsManager.ts', content);
console.log('Updated SettingsManager');
