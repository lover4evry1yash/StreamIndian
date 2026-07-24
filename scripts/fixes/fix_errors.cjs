const fs = require('fs');
let boot = fs.readFileSync('src/core/Bootstrap.ts', 'utf8');

// Bootstrap.ts(57,17): error TS2305: Module '"./rendering"' has no exported member 'ArtworkAggregator'.
boot = boot.replace(/import \{ ImageManager \} from '\.\/rendering\/ImageManager';\nimport \{ ArtworkAggregator \} from '\.\/metadata\/ArtworkAggregator';/, 
`import { ImageManager } from './rendering/ImageManager';
import { ArtworkAggregator } from './metadata/ArtworkAggregator';`);
boot = boot.replace(/ImageManager, ArtworkAggregator,/g, 'ImageManager,');

// Bootstrap.ts(133,55): error TS2448: Block-scoped variable 'providerManager' used before its declaration.
boot = boot.replace(/const artworkAggregator = new ArtworkAggregator\(providerManager, cacheManager, logger\);\n      container\.register\('ArtworkAggregator', artworkAggregator\);\n\n      const imageManager = new ImageManager\(networkClient, artworkAggregator, logger\);\n      container\.register\('ImageManager', imageManager\);/, '');

// Move it after providerManager is declared
boot = boot.replace(/const providerManager = new ProviderManager\(providerContext, providerRegistry, requestScheduler\);\n      container\.register\('ProviderManager', providerManager\);/, 
`const providerManager = new ProviderManager(providerContext, providerRegistry, requestScheduler);
      container.register('ProviderManager', providerManager);

      const artworkAggregator = new ArtworkAggregator(providerManager, storageManager.getCache(), logger);
      container.register('ArtworkAggregator', artworkAggregator);

      const imageManager = new ImageManager(networkClient, artworkAggregator, logger);
      container.register('ImageManager', imageManager);`);

// Bootstrap.ts(270,68): error TS2304: Cannot find name 'artworkManager'.
boot = boot.replace(/artworkManager/g, 'imageManager');
fs.writeFileSync('src/core/Bootstrap.ts', boot);

// ArtworkAggregator.ts(21,35): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string'.
let agg = fs.readFileSync('src/core/metadata/ArtworkAggregator.ts', 'utf8');
agg = agg.replace(/const provider = p as IArtworkProvider;/g, 'const provider = p as unknown as IArtworkProvider;');
agg = agg.replace(/provider\.getArtwork\(mediaId, type, externalIds\)/g, 'provider.getArtwork(mediaId, type, externalIds)');
fs.writeFileSync('src/core/metadata/ArtworkAggregator.ts', agg);

console.log('Fixed TS errors.');
