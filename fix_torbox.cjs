const fs = require('fs');

let file = fs.readFileSync('src/core/streams/debrid/providers/TorBoxDebridProvider.ts', 'utf8');

file = file.replace(/public async initialize\(context\?: any\): Promise<void> \{/, 
`public async initialize(context?: any): Promise<void> {
    if (context && context.settingsManager) {
      this.apiKey = context.settingsManager.getSettings().providers?.torbox?.apiKey || '';
    }`);

file = file.replace(/this\.isAvailable = true;/, 
`this.isAvailable = !!this.apiKey;`);

fs.writeFileSync('src/core/streams/debrid/providers/TorBoxDebridProvider.ts', file);
console.log('Fixed TorBoxDebridProvider');

