const fs = require('fs');

let boot = fs.readFileSync('src/core/Bootstrap.ts', 'utf8');
boot = boot.replace(/const providerContext: ProviderContext = \{/, 
`const providerContext: ProviderContext = {
        settingsManager,`);
fs.writeFileSync('src/core/Bootstrap.ts', boot);
console.log('Fixed Bootstrap providerContext');
