import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PlaybackHistoryService } from './PlaybackHistoryService';
import type { CacheManager } from '../../storage/CacheManager';

function createCache() {
  const values = new Map<string, unknown>();
  const cache = {
    async get<T>(group: string, key: string): Promise<T | null> {
      return (values.get(`${group}:${key}`) as T | undefined) ?? null;
    },
    async set(group: string, key: string, value: unknown): Promise<void> {
      values.set(`${group}:${key}`, value);
    },
  } as unknown as CacheManager;
  return cache;
}

test('playback history index returns saved records in recent-first order', async () => {
  const service = new PlaybackHistoryService(createCache());
  await service.saveProgress('first', 'stream-1', 20, 100);
  await service.saveProgress('second', 'stream-2', 50, 100);
  await service.markCompleted('first');

  const history = await service.getAllHistory();
  assert.deepEqual(history.map((record) => record.mediaId), ['first', 'second']);
  assert.equal(history[0].completed, true);
  assert.equal(history[1].currentTime, 50);
});

test('playback history returns no progress for items without a saved playback record', async () => {
  const service = new PlaybackHistoryService(createCache());
  assert.deepEqual(await service.getAllHistory(), []);
});
