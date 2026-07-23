export interface AsyncStorageProvider {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  exists(key: string): Promise<boolean>;
}

export enum CachePolicyType {
  PLAYBACK_PROGRESS = 'PLAYBACK_PROGRESS',
  SETTINGS = 'SETTINGS',
  METADATA = 'METADATA',
  IMAGES = 'IMAGES',
  PROVIDER_RESPONSES = 'PROVIDER_RESPONSES',
  STREAM_RESOLUTIONS = 'STREAM_RESOLUTIONS'
}

export interface CachePolicy {
  ttlMs: number;
  maxItems?: number;
  persistence: boolean;
  priority: number;
}

export const CachePolicies: Record<CachePolicyType, CachePolicy> = {
  [CachePolicyType.PLAYBACK_PROGRESS]: {
    ttlMs: 30 * 24 * 60 * 60 * 1000,
    maxItems: 100,
    persistence: true,
    priority: 100,
  },
  [CachePolicyType.SETTINGS]: {
    ttlMs: 0,
    persistence: true,
    priority: 1000,
  },
  [CachePolicyType.METADATA]: {
    ttlMs: 24 * 60 * 60 * 1000,
    maxItems: 500,
    persistence: true,
    priority: 50,
  },
  [CachePolicyType.IMAGES]: {
    ttlMs: 7 * 24 * 60 * 60 * 1000,
    maxItems: 1000,
    persistence: true,
    priority: 10,
  },

  [CachePolicyType.STREAM_RESOLUTIONS]: {
    ttlMs: 4 * 60 * 60 * 1000, // 4 hours
    maxItems: 50,
    persistence: false, // Stream URLs often expire, so memory is usually better, but true is fine for now
    priority: 80,
  },
  [CachePolicyType.PROVIDER_RESPONSES]: {
    ttlMs: 2 * 60 * 60 * 1000,
    maxItems: 200,
    persistence: true,
    priority: 30,
  }
};
