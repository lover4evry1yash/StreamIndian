const fs = require('fs');

// Bootstrap.ts
let boot = fs.readFileSync('src/core/Bootstrap.ts', 'utf8');
boot = boot.replace(/const artworkAggregator = new ArtworkAggregator\(providerManager, storageManager\.getCache\(\), logger\);/, 
'const artworkAggregator = new ArtworkAggregator(providerManager, cacheManager, logger);');
fs.writeFileSync('src/core/Bootstrap.ts', boot);

// ArtworkAggregator.ts
let agg = fs.readFileSync('src/core/metadata/ArtworkAggregator.ts', 'utf8');
agg = agg.replace(/const provider = p as unknown as IArtworkProvider;/g, 
'const provider = p as unknown as IArtworkProvider;\n          return provider.getArtwork(mediaId, type, externalIds);');
agg = agg.replace(/provider\.getArtwork\(mediaId, type, externalIds\)\n          return provider\.getArtwork\(mediaId, type, externalIds\)/g, 'return provider.getArtwork(mediaId, type, externalIds)');

// Wait, the error is: ArtworkAggregator.ts(21,35): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string'.
// Ah, `execute` expects a function taking an `IProvider`.
// Execute takes `IProvider`. But where does the error happen?
