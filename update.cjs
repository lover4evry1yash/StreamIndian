const fs = require('fs');

// 1. Update ValidationLayer.ts
let vLayer = fs.readFileSync('src/core/metadata/ValidationLayer.ts', 'utf8');
vLayer = vLayer.replace(/private static validateArtworkSet\(artwork\?: Partial<ArtworkSet>\): ArtworkSet \{/g, 
`private static validateArtworkSet(artwork?: Partial<ArtworkSet>, mediaContext?: { id: string, type: string }): ArtworkSet {`);
vLayer = vLayer.replace(/return \{\n      posters: this\.validateImages\(artwork\.posters\),/g,
`const validated = {
      posters: this.validateImages(artwork.posters),`);
vLayer = vLayer.replace(/characterArts: this\.validateImages\(artwork\.characterArts\),\n    \};/g,
`characterArts: this.validateImages(artwork.characterArts),
    };
    if (mediaContext) {
      const { id, type } = mediaContext;
      validated.posters.unshift({ type: 'poster', url: \`artwork://\${type}/\${id}/poster\`, provider: 'virtual' });
      validated.backdrops.unshift({ type: 'backdrop', url: \`artwork://\${type}/\${id}/backdrop\`, provider: 'virtual' });
      validated.logos.unshift({ type: 'logo', url: \`artwork://\${type}/\${id}/logo\`, provider: 'virtual' });
    }
    return validated;`);

vLayer = vLayer.replace(/artwork: this\.validateArtworkSet\(movie\.artwork\)/g, "artwork: this.validateArtworkSet(movie.artwork, { id: String(movie.id), type: 'movie' })");
vLayer = vLayer.replace(/artwork: this\.validateArtworkSet\(series\.artwork\)/g, "artwork: this.validateArtworkSet(series.artwork, { id: String(series.id), type: 'series' })");
vLayer = vLayer.replace(/artwork: this\.validateArtworkSet\(anime\.artwork\)/g, "artwork: this.validateArtworkSet(anime.artwork, { id: String(anime.id), type: 'anime' })");
vLayer = vLayer.replace(/artwork: this\.validateArtworkSet\(season\.artwork\)/g, "artwork: this.validateArtworkSet(season.artwork, { id: String(season.id), type: 'season' })");
vLayer = vLayer.replace(/artwork: this\.validateArtworkSet\(episode\.artwork\)/g, "artwork: this.validateArtworkSet(episode.artwork, { id: String(episode.id), type: 'episode' })");

fs.writeFileSync('src/core/metadata/ValidationLayer.ts', vLayer);

// 2. index.ts
fs.writeFileSync('src/core/rendering/index.ts', "export * from './ImageManager';\nexport * from './PrefetchManager';\nexport * from './RenderMetrics';\n");

// 3. PrefetchManager
let pf = fs.readFileSync('src/core/rendering/PrefetchManager.ts', 'utf8');
pf = pf.replace(/ArtworkManager/g, 'ImageManager');
fs.writeFileSync('src/core/rendering/PrefetchManager.ts', pf);

// 4. ServiceContext
let sc = fs.readFileSync('src/context/ServiceContext.tsx', 'utf8');
sc = sc.replace(/ArtworkManager/g, 'ImageManager');
fs.writeFileSync('src/context/ServiceContext.tsx', sc);

// 5. LazyImage
let li = fs.readFileSync('src/components/LazyImage.tsx', 'utf8');
li = li.replace(/ArtworkManager/g, 'ImageManager');
li = li.replace(/useArtworkManager/g, 'useImageManager');
li = li.replace(/artworkManager/g, 'imageManager');
fs.writeFileSync('src/components/LazyImage.tsx', li);

sc = fs.readFileSync('src/context/ServiceContext.tsx', 'utf8');
sc = sc.replace(/useArtworkManager/g, 'useImageManager');
fs.writeFileSync('src/context/ServiceContext.tsx', sc);

// 6. Bootstrap.ts
let boot = fs.readFileSync('src/core/Bootstrap.ts', 'utf8');
boot = boot.replace(/import \{ ArtworkManager \} from '\.\/rendering\/ArtworkManager';/, "import { ImageManager } from './rendering/ImageManager';\nimport { ArtworkAggregator } from './metadata/ArtworkAggregator';");
boot = boot.replace(/ArtworkManager,/g, 'ImageManager, ArtworkAggregator,');
boot = boot.replace(/const artworkManager = new ArtworkManager\(imageCache, logger\);\n      container\.register\('ArtworkManager', artworkManager\);/g,
`const artworkAggregator = new ArtworkAggregator(providerManager, cacheManager, logger);
      container.register('ArtworkAggregator', artworkAggregator);

      const imageManager = new ImageManager(networkClient, artworkAggregator, logger);
      container.register('ImageManager', imageManager);`);
fs.writeFileSync('src/core/Bootstrap.ts', boot);

// Delete ArtworkManager
if (fs.existsSync('src/core/rendering/ArtworkManager.ts')) {
   fs.unlinkSync('src/core/rendering/ArtworkManager.ts');
}

console.log('Update script completed.');
