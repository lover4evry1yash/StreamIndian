const fs = require('fs');

// ArtworkAggregator
let agg = fs.readFileSync('src/core/metadata/ArtworkAggregator.ts', 'utf8');
agg = agg.replace(/const cached = await this\.cache\.get\('artwork_agg', cacheKey, CachePolicyType\.METADATA\);\n    if \(cached\) return JSON\.parse\(cached\);/, 
`const cached = await this.cache.get<ArtworkSet>('artwork_agg', cacheKey, CachePolicyType.METADATA);
    if (cached) return cached;`);
agg = agg.replace(/await this\.cache\.set\('artwork_agg', cacheKey, JSON\.stringify\(mergedSet\), CachePolicyType\.METADATA\);/, 
`await this.cache.set<ArtworkSet>('artwork_agg', cacheKey, mergedSet, CachePolicyType.METADATA);`);
fs.writeFileSync('src/core/metadata/ArtworkAggregator.ts', agg);

// Bootstrap
let boot = fs.readFileSync('src/core/Bootstrap.ts', 'utf8');
boot = boot.replace(/const artworkAggregator = new ArtworkAggregator\(providerManager, storageManager\.getCache\(\), logger\);/g, 
'const artworkAggregator = new ArtworkAggregator(providerManager, cacheManager, logger);');
fs.writeFileSync('src/core/Bootstrap.ts', boot);

console.log('Fixed fix_errors3');
