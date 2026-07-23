const fs = require('fs');
let provider = fs.readFileSync('src/core/providers/fanart/FanartProvider.ts', 'utf8');
provider = provider.replace(/this\.client = new FanartClient\(context\.network, context\.cache, context\.logger\);/,
`this.client = new FanartClient(context.network, context.cache, context.logger, context.settingsManager);`);
fs.writeFileSync('src/core/providers/fanart/FanartProvider.ts', provider);

let client = fs.readFileSync('src/core/providers/fanart/FanartClient.ts', 'utf8');
client = client.replace(/import \{ Logger \} from '\.\.\/\.\.\/Logger';/, `import { Logger } from '../../Logger';\nimport { SettingsManager } from '../../storage/SettingsManager';`);
client = client.replace(/private logger: Logger;/, `private logger: Logger;\n  private settings: SettingsManager;`);
client = client.replace(/constructor\(network: NetworkClient, cache: CacheManager, logger: Logger\) \{/, `constructor(network: NetworkClient, cache: CacheManager, logger: Logger, settings: SettingsManager) {`);
client = client.replace(/this\.logger = logger;/, `this.logger = logger;\n    this.settings = settings;`);
client = client.replace(/const FANART_API_KEY = 'YOUR_FANART_API_KEY';/, ``);
client = client.replace(/const url = \`\$\{BASE_URL\}\$\{path\}\?api_key=\$\{FANART_API_KEY\}\`;/, 
`const apiKey = this.settings.getSettings().providers?.fanart?.apiKey;
    if (!apiKey) {
      this.logger.warn('Fanart API Key not configured');
      return null;
    }
    const url = \`\$\{BASE_URL\}\$\{path\}?api_key=\$\{apiKey\}\`;`);
fs.writeFileSync('src/core/providers/fanart/FanartClient.ts', client);
console.log('Fixed FanartClient');
