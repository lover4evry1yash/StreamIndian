const fs = require('fs');

let provider = fs.readFileSync('src/core/providers/tmdb/TMDBProvider.ts', 'utf8');
provider = provider.replace(/this\.client = new TMDBClient\(context\.network, context\.config\);/, 
`this.client = new TMDBClient(context.network, context.settingsManager);`);
fs.writeFileSync('src/core/providers/tmdb/TMDBProvider.ts', provider);

let client = fs.readFileSync('src/core/providers/tmdb/TMDBClient.ts', 'utf8');
client = client.replace(/import \{ Config \} from '\.\.\/\.\.\/Config';/, `import { SettingsManager } from '../../storage/SettingsManager';`);
client = client.replace(/private config: Config;/, `private settings: SettingsManager;`);
client = client.replace(/constructor\(network: NetworkClient, config: Config\) \{/, `constructor(network: NetworkClient, settings: SettingsManager) {`);
client = client.replace(/this\.config = config;/, `this.settings = settings;`);
client = client.replace(/const tmdbConfig = this\.config\.get\('tmdb'\);/, `const tmdbConfig = { apiKey: this.settings.getSettings().providers?.tmdb?.apiKey, language: 'en-US', timeoutMs: 10000 };`);
fs.writeFileSync('src/core/providers/tmdb/TMDBClient.ts', client);

console.log('Fixed TMDBClient');
