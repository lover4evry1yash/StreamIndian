import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { MediaItem } from '../../types/tizen';
import { Logger } from '../Logger';
import { HomeViewModel } from './HomeViewModel';
import type { PlaybackHistoryRecord } from '../playback/services/PlaybackHistoryService';

const item = (id: string, title: string, genres: string[]): MediaItem => ({
  id, mediaType: 'movie', title, language: 'Hindi', year: 2025, durationMinutes: 100,
  rating: 'U/A', imdbRating: 7, genres, posterUrl: '', backdropUrl: '', description: '',
  cast: ['Actor'], director: 'Director', provider: 'Synthetic catalog', streams: [],
});

test('home shelves use playback progress for continue watching and local signals for recommendations', async () => {
  const catalog = [
    item('watched', 'Watched title', ['Drama']),
    item('continue', 'In progress title', ['Comedy']),
    item('recommended', 'Recommended title', ['Drama']),
  ];
  const history: PlaybackHistoryRecord[] = [
    { mediaId: 'watched', streamId: null, currentTime: 0, duration: 100, completionPercentage: 1, lastWatched: 2, completed: true },
    { mediaId: 'continue', streamId: null, currentTime: 30, duration: 100, completionPercentage: 0.3, lastWatched: 1, completed: false },
  ];
  const catalogService = { getUnifiedCatalog: async () => catalog };
  const historyService = { getAllHistory: async () => history };
  const viewModel = new HomeViewModel(catalogService as never, new Logger(), historyService as never);

  await viewModel.load('All');

  const shelves = viewModel.getShelves();
  assert.deepEqual(shelves.find((shelf) => shelf.type === 'continue_watching')?.items.map((entry) => entry.id), ['continue']);
  assert.deepEqual(shelves.find((shelf) => shelf.type === 'because_you_watched')?.items.map((entry) => entry.id), ['recommended']);
});
