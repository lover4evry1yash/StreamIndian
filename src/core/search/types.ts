import { Movie, Series, Person } from '../models/DomainModels';

export interface SearchQuery {
  query: string;
  mediaTypes?: ('movie' | 'series' | 'person')[];
  language?: string;
  region?: string;
  page?: number;
  includeAdult?: boolean;
}

export type SearchResultItem = Movie | Series | Person;

export interface SearchResult {
  query: string;
  items: SearchResultItem[];
  page: number;
  totalPages: number;
  totalResults: number;
}

export interface SearchFilters {
  genres?: string[];
  year?: number;
  rating?: number;
}

export enum SearchErrorType {
  INVALID_QUERY = 'INVALID_QUERY',
  CANCELLED = 'CANCELLED',
  PROVIDER_UNAVAILABLE = 'PROVIDER_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  NETWORK_FAILURE = 'NETWORK_FAILURE',
  UNKNOWN = 'UNKNOWN',
}

export interface SearchError {
  type: SearchErrorType;
  message: string;
  originalError?: any;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: number;
}

export enum SearchEventType {
  SEARCH_STARTED = 'SEARCH_STARTED',
  SEARCH_UPDATED = 'SEARCH_UPDATED',
  SEARCH_COMPLETED = 'SEARCH_COMPLETED',
  SEARCH_FAILED = 'SEARCH_FAILED',
  SEARCH_CANCELLED = 'SEARCH_CANCELLED',
}
