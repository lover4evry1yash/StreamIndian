export enum MetadataEventType {
  LOADED = 'METADATA_LOADED',
  UPDATED = 'METADATA_UPDATED',
  INVALIDATED = 'METADATA_INVALIDATED',
  PREFETCHED = 'METADATA_PREFETCHED',
  ERROR = 'METADATA_ERROR',
}

export interface MetadataEventPayload {
  type: 'movie' | 'series' | 'season' | 'episode' | 'person' | 'collection' | 'image';
  id: string;
  data?: any;
  error?: any;
}
