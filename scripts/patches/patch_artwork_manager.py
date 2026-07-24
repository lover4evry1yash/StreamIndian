content = open('src/core/rendering/ArtworkManager.ts').read()
import_add = """import { ImageCache } from '../storage';
import { Logger } from '../Logger';
import { MediaItem } from '../../types/tizen';
import { ArtworkSet, Image as DomainImage } from '../models/DomainModels';
"""
content = content.replace("import { ImageCache } from '../storage';\nimport { Logger } from '../Logger';\nimport { MediaItem } from '../../types/tizen';", import_add)

methods_add = """
  // --- Artwork Pipeline ---
  public processArtworkSet(set: ArtworkSet, preferredLanguage: string = 'en'): ArtworkSet {
    return {
      posters: this.rankAndFilter(set.posters, 'poster', preferredLanguage),
      backdrops: this.rankAndFilter(set.backdrops, 'backdrop', preferredLanguage),
      banners: this.rankAndFilter(set.banners, 'banner', preferredLanguage),
      landscapes: this.rankAndFilter(set.landscapes, 'landscape', preferredLanguage),
      thumbs: this.rankAndFilter(set.thumbs, 'thumb', preferredLanguage),
      logos: this.rankAndFilter(set.logos, 'logo', preferredLanguage),
      clearLogos: this.rankAndFilter(set.clearLogos, 'clearlogo', preferredLanguage),
      clearArts: this.rankAndFilter(set.clearArts, 'clearart', preferredLanguage),
      discArts: this.rankAndFilter(set.discArts, 'discart', preferredLanguage),
      characterArts: this.rankAndFilter(set.characterArts, 'characterart', preferredLanguage),
    };
  }

  private rankAndFilter(images: DomainImage[], type: string, preferredLanguage: string): DomainImage[] {
    if (!images || images.length === 0) return [];
    
    // 1. Remove duplicates by URL
    const uniqueMap = new Map<string, DomainImage>();
    for (const img of images) {
      if (!img.url) continue;
      if (!uniqueMap.has(img.url)) {
        uniqueMap.set(img.url, img);
      }
    }
    const uniqueImages = Array.from(uniqueMap.values());

    // 2. Score and Rank
    uniqueImages.sort((a, b) => this.scoreImage(b, preferredLanguage) - this.scoreImage(a, preferredLanguage));

    // 3. Resolution Selection (assuming highest scored is best, but could filter by resolution bounds)
    return uniqueImages;
  }

  private scoreImage(image: DomainImage, preferredLanguage: string): number {
    let score = 0;
    
    // Quality scoring
    if (image.provider === 'rpdb') score += 100; // RPDB usually has curated ratings posters
    if (image.provider === 'fanart') score += 50; // Fanart is high quality
    
    // Resolution selection (reward higher res up to 4K, penalize overly large)
    if (image.width && image.height) {
      const pixels = image.width * image.height;
      if (pixels >= 1920 * 1080) score += 20;
      else if (pixels >= 1280 * 720) score += 10;
    }

    // Language fallback chain
    if (image.language === preferredLanguage) {
      score += 30; // Match preferred
    } else if (!image.language || image.language === 'xx' || image.language === '') {
      score += 20; // Textless is good fallback
    } else if (image.language === 'en') {
      score += 10; // English as secondary fallback
    }

    return score;
  }
  
  public selectBest(images: DomainImage[]): DomainImage | null {
    if (!images || images.length === 0) return null;
    return images[0]; // Assuming already ranked
  }

  public getFallbackChain(set: ArtworkSet, type: string): DomainImage[] {
    // Return a chain of fallbacks for a given type
    if (type === 'logo') {
      return [...(set.clearLogos || []), ...(set.logos || [])];
    }
    if (type === 'poster') {
      return [...(set.posters || []), ...(set.clearArts || [])];
    }
    if (type === 'backdrop') {
      return [...(set.backdrops || []), ...(set.landscapes || []), ...(set.banners || [])];
    }
    return [];
  }
"""
content = content.replace("  // --- Internal State Machine ---", methods_add + "\n  // --- Internal State Machine ---")

open('src/core/rendering/ArtworkManager.ts', 'w').write(content)
