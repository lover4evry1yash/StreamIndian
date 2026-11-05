import 'fake-indexeddb/auto';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Logger } from '../Logger';
import { NetworkClient } from '../NetworkClient';
import { IptvManager } from './IptvManager';
import { iptvDb } from './IptvDatabase';

async function resetDatabase(): Promise<void> {
  await iptvDb.delete();
  await iptvDb.open();
}

test('IPTV manager searches within a playlist and returns bounded, grouped results', async () => {
  await resetDatabase();
  try {
    const manager = new IptvManager({} as NetworkClient, new Logger());
    const playlist = await manager.addPlaylist({
      name: 'Synthetic playlist', type: 'm3u', url: 'https://provider.example.test/list.m3u', autoUpdate: false,
    });
    const other = await manager.addPlaylist({
      name: 'Other playlist', type: 'm3u', url: 'https://other.example.test/list.m3u', autoUpdate: false,
    });
    await iptvDb.channels.bulkPut([
      { id: 'one', playlistId: playlist.id, name: 'Synthetic News', streamUrl: 'https://media.example.test/1', group: 'News', isFavorite: false, isHidden: false },
      { id: 'two', playlistId: playlist.id, name: 'Synthetic Sports', streamUrl: 'https://media.example.test/2', group: 'Sports', isFavorite: true, isHidden: false },
      { id: 'hidden', playlistId: playlist.id, name: 'Hidden News', streamUrl: 'https://media.example.test/3', group: 'News', isFavorite: false, isHidden: true },
      { id: 'other', playlistId: other.id, name: 'Synthetic News Elsewhere', streamUrl: 'https://other.example.test/1', group: 'News', isFavorite: false, isHidden: false },
    ]);

    assert.deepEqual(await manager.getChannelGroups(playlist.id), ['News', 'Sports']);
    assert.deepEqual((await manager.searchChannels('synthetic', 20, playlist.id)).map((channel) => channel.id), ['one', 'two']);
    assert.deepEqual((await manager.getChannelsByGroup(playlist.id, 'News', 1)).map((channel) => channel.id), ['one']);
    assert.deepEqual((await manager.userDataManager.getFavoritesByPlaylist(playlist.id)).map((channel) => channel.id), ['two']);
  } finally {
    await iptvDb.delete();
  }
});

test('EPG lookups use playlist-scoped time indexes for current and upcoming programmes', async () => {
  await resetDatabase();
  try {
    const manager = new IptvManager({} as NetworkClient, new Logger());
    const now = Date.now();
    await iptvDb.programs.bulkPut([
      { id: 'current-one', playlistId: 'one', tvgId: 'guide.channel', title: 'Current', startTime: now - 60_000, endTime: now + 60_000 },
      { id: 'upcoming-one', playlistId: 'one', tvgId: 'guide.channel', title: 'Upcoming', startTime: now + 60_000, endTime: now + 120_000 },
      { id: 'current-two', playlistId: 'two', tvgId: 'guide.channel', title: 'Other provider', startTime: now - 60_000, endTime: now + 60_000 },
    ]);

    assert.equal((await manager.epgManager.getNowPlaying('guide.channel', 'one'))?.title, 'Current');
    assert.deepEqual((await manager.epgManager.getUpcoming('guide.channel', now, 5, 'one')).map((program) => program.title), ['Upcoming']);
    assert.deepEqual((await manager.epgManager.getPrograms('guide.channel', now, now + 3 * 60_000, 'one')).map((program) => program.title), ['Current', 'Upcoming']);
  } finally {
    await iptvDb.delete();
  }
});
