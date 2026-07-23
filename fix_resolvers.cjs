const fs = require('fs');

let r = fs.readFileSync('src/core/streams/ResolverManager.ts', 'utf8');
r = r.replace(/initializeAll\(\): Promise<void> \{/, `initializeAll(context?: any): Promise<void> {`);
r = r.replace(/await resolver.initialize\(\);/, `await resolver.initialize(context);`);
fs.writeFileSync('src/core/streams/ResolverManager.ts', r);

let d = fs.readFileSync('src/core/streams/debrid/DebridManager.ts', 'utf8');
d = d.replace(/initialize\(\): Promise<void> \{/, `initialize(context?: any): Promise<void> {`);
d = d.replace(/await provider.initialize\(\);/, `await provider.initialize(context);`);
fs.writeFileSync('src/core/streams/debrid/DebridManager.ts', d);

let b = fs.readFileSync('src/core/Bootstrap.ts', 'utf8');
b = b.replace(/await resolverManager\.initializeAll\(\);/, `await resolverManager.initializeAll(providerContext);`);
b = b.replace(/await debridManager\.initialize\(\);/, `await debridManager.initialize(providerContext);`);
fs.writeFileSync('src/core/Bootstrap.ts', b);

console.log('Fixed stream contexts');
