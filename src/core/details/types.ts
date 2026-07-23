import { Movie, Series, Anime, Episode, Season } from '../models/DomainModels';

export type MediaType = 'movie' | 'series' | 'anime';

export interface MediaDetails {
  type: MediaType;
  data: Movie | Series | Anime;
  activeSeason?: Season;
  activeEpisodes?: Episode[];
  related?: any[];
}

export interface MediaSection {
  id: string;
  type: 'overview' | 'cast' | 'episodes' | 'related' | 'collections' | 'characters' | 'studios' | 'artwork' | 'trailers' | 'recommendations' | 'metadata';
  title: string;
  data: any;
  order: number;
}

export enum MediaActionType {
  PLAY = 'PLAY',
  RESUME = 'RESUME',
  WATCH_TRAILER = 'WATCH_TRAILER',
  ADD_TO_WATCHLIST = 'ADD_TO_WATCHLIST',
  MARK_WATCHED = 'MARK_WATCHED',
  OPEN_COLLECTION = 'OPEN_COLLECTION',
  OPEN_STUDIO = 'OPEN_STUDIO',
  OPEN_ACTOR = 'OPEN_ACTOR',
  OPEN_RELATED = 'OPEN_RELATED'
}

export interface MediaAction {
  id: string;
  type: MediaActionType;
  label: string;
  icon?: string;
  isPrimary?: boolean;
  payload?: any;
}
