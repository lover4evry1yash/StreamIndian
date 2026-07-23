const fs = require('fs');
let content = fs.readFileSync('src/core/providers/ProviderManager.ts', 'utf8');

// Insert setting rate limits in initializeAll
content = content.replace(/await provider\.initialize\(scopedContext\);/, `await provider.initialize(scopedContext);
        if (provider.rateLimits) {
          this.context.network.setProviderLimits(provider.id, provider.rateLimits);
        }`);
fs.writeFileSync('src/core/providers/ProviderManager.ts', content);
