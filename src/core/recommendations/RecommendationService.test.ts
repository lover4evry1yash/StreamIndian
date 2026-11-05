import assert from 'node:assert/strict';
import { test } from 'node:test';
import { RecommendationService } from './RecommendationService';
import type { MediaItem } from '../../types/tizen';

const media = (id: string, genres: string[], options: Partial<MediaItem> = {}): MediaItem => ({
  id,
  mediaType: 'movie',
  title: id,
  language: 'English',
  year: 2025,
  durationMinutes: 100,
  rating: 'U/A',
  genres,
  posterUrl: '',
  backdropUrl: '',
  description: '',
  cast: [],
  director: '',
  provider: 'fixture',
  streams: [],
  ...options,
});

test('recommendations rank catalog items from viewing history and omit watched and saved items', () => {
  const watched = media('watched', ['Drama', 'Mystery'], { cast: ['Actor One'] });
  const related = media('related', ['Mystery'], { cast: ['Actor One'], imdbRating: 7.5 });
  const saved = media('saved', ['Mystery']);
  const unrelated = media('unrelated', ['Comedy']);
  const service = new RecommendationService({ limit: 10 });

  assert.deepEqual(service.recommend([watched, related, saved, unrelated], {
    history: [watched],
    favorites: [saved],
  }), [related]);
});

test('recommendations do not invent results without a personalized metadata signal', () => {
  const service = new RecommendationService();
  assert.deepEqual(service.recommend([media('catalog-item', [])], { history: [] }), []);
});

test('language preference can rank catalog items when catalog metadata is present', () => {
  const service = new RecommendationService();
  const hindi = media('hindi-title', ['Drama'], { language: 'Hindi' });
  const tamil = media('tamil-title', ['Drama'], { language: 'Tamil' });

  assert.deepEqual(service.recommend([tamil, hindi], { history: [], preferredLanguages: ['Hindi'] }), [hindi]);
});
