import { CacheManager } from './CacheManager';
import { CachePolicyType } from './types';

export class ImageCache {
  private cache: CacheManager;

  constructor(cache: CacheManager) {
    this.cache = cache;
  }

  public async getPoster(id: string): Promise<string | null> {
    return this.cache.get('img_poster', id, CachePolicyType.IMAGES);
  }

  public async setPoster(id: string, urlOrBase64: string): Promise<void> {
    return this.cache.set('img_poster', id, urlOrBase64, CachePolicyType.IMAGES);
  }

  public async getBackdrop(id: string): Promise<string | null> {
    return this.cache.get('img_backdrop', id, CachePolicyType.IMAGES);
  }

  public async setBackdrop(id: string, urlOrBase64: string): Promise<void> {
    return this.cache.set('img_backdrop', id, urlOrBase64, CachePolicyType.IMAGES);
  }

  public async getLogo(id: string): Promise<string | null> {
    return this.cache.get('img_logo', id, CachePolicyType.IMAGES);
  }

  public async setLogo(id: string, urlOrBase64: string): Promise<void> {
    return this.cache.set('img_logo', id, urlOrBase64, CachePolicyType.IMAGES);
  }
}
