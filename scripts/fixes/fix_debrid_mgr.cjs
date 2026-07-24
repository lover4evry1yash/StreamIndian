const fs = require('fs');

let file = fs.readFileSync('src/core/streams/debrid/DebridManager.ts', 'utf8');
file = file.replace(/public async initializeAll\(\): Promise<void> \{/, `public async initializeAll(context?: any): Promise<void> {`);
file = file.replace(/await provider\.initialize\(\{\} as any\);/, `await provider.initialize(context);`);
fs.writeFileSync('src/core/streams/debrid/DebridManager.ts', file);

let b = fs.readFileSync('src/core/Bootstrap.ts', 'utf8');
b = b.replace(/await debridManager\.initialize\(providerContext\);/, `await debridManager.initializeAll(providerContext);`); // I messed this up previously
b = b.replace(/await debridManager\.initializeAll\(\);/, `await debridManager.initializeAll(providerContext);`);
fs.writeFileSync('src/core/Bootstrap.ts', b);

console.log('Fixed DebridManager');

