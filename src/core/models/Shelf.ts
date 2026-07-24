import { MediaItem } from '../../types/tizen';

export type ShelfType = 
  | 'continue_watching'
  | 'featured'
  | 'trending'
  | 'movies'
  | 'series'
  | 'anime'
  | 'regional'
  | 'because_you_watched'
  | 'recently_added'
  | 'pinned'
  | 'resume_watching'
  | 'offline_downloads';

export interface ShelfContext {
  region?: string;
  language?: string;
  userHistory?: string[]; // Media IDs
  userFavorites?: string[]; // Media IDs
  targetMedia?: MediaItem; // For related shelves
}

export interface ShelfRule {
  isVisible: (context: ShelfContext) => boolean;
  priority: number; // Lower is higher priority
}

export interface Shelf {
  id: string;
  type: ShelfType;
  title: string;
  subtitle?: string;
  rule: ShelfRule;
  // This could later be an interface defining how to fetch data, but for now we'll keep items
  items: MediaItem[];
  isLoading?: boolean;
  error?: string;
}
