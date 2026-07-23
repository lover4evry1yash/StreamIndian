const fs = require('fs');

let file = fs.readFileSync('src/core/streams/resolvers/TorBoxResolver.ts', 'utf8');

file = file.replace(/public async initialize\(\): Promise<void> \{/, 
`public async initialize(context?: any): Promise<void> {
    if (context && context.settingsManager) {
      this.apiKey = context.settingsManager.getSettings().providers?.torbox?.apiKey || '';
    }`);

fs.writeFileSync('src/core/streams/resolvers/TorBoxResolver.ts', file);
console.log('Fixed TorBoxResolver');

