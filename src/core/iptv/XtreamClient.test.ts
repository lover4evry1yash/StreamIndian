import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Logger } from '../Logger';
import type { NetworkClient } from '../NetworkClient';
import type { IptvPlaylist } from './models';
import { XtreamClient } from './XtreamClient';

const playlist: IptvPlaylist = {
  id: 'playlist_with_underscores',
  name: 'Synthetic provider',
  url: 'https://provider.example.test:443/api/',
  type: 'xtream',
  username: 'YOUR USER',
  password: 'YOUR@PASSWORD',
  autoUpdate: false,
  lastUpdated: 0,
};

test('Xtream VOD and series episode URLs are encoded and invalid records are discarded', async () => {
  let episodeMaxResponseBytes: number | undefined;
  const network = {
    getJson: async (url: string, options?: { maxResponseBytes?: number }) => {
      if (url.includes('get_series_info')) episodeMaxResponseBytes = options?.maxResponseBytes;
      if (url.includes('get_live_streams')) return [{ stream_id: 12, name: 'Synthetic Live' }];
      if (url.includes('get_vod_streams')) return [
        { stream_id: 23, name: 'Synthetic Movie', container_extension: 'mp4', category_id: 4 },
        { stream_id: '24', name: 'Unsafe extension', container_extension: '../mp4' },
        { stream_id: 'invalid', name: 'Invalid ID', container_extension: 'mkv' },
      ];
      return { episodes: { '0': [{ id: 90, title: 'Synthetic Episode', container_extension: 'mkv', episode_num: 1 }] } };
    },
  } as unknown as NetworkClient;
  const client = new XtreamClient(network, new Logger());

  const live = await client.fetchLiveStreams(playlist);
  assert.equal(live[0].contentType, 'live');
  assert.equal(live[0].streamUrl, 'https://provider.example.test/api/YOUR%20USER/YOUR%40PASSWORD/live/12.ts');

  const movies = await client.fetchVodStreams(playlist);
  assert.equal(movies.length, 1);
  assert.equal(movies[0].contentType, 'vod');
  assert.equal(movies[0].streamUrl, 'https://provider.example.test/api/YOUR%20USER/YOUR%40PASSWORD/movie/23.mp4');

  const episodes = await client.fetchSeriesEpisodes(playlist, '7');
  assert.equal(episodes.length, 1);
  assert.equal(episodes[0].streamUrl, 'https://provider.example.test/api/YOUR%20USER/YOUR%40PASSWORD/series/90.mkv');
  assert.equal(episodes[0].seasonNumber, 1);
  assert.equal(episodes[0].contentType, 'episode');
  assert.equal(episodeMaxResponseBytes, 32 * 1024 * 1024);
});
