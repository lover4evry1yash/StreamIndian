import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Config } from './Config';
import { EventBus } from './EventBus';
import { LogLevel, Logger } from './Logger';
import { AppLifecycle, AppLifecycleEvent } from './AppLifecycle';
import { PlaybackManager } from './playback/PlaybackManager';
import { PlaybackState } from './playback/types';

test('configuration provides safe defaults and returns isolated snapshots', () => {
  const config = new Config();
  assert.equal(config.get('tmdb').apiKey, '');
  const snapshot = config.getAll();
  snapshot.tmdb.apiKey = 'changed';
  assert.equal(config.get('tmdb').apiKey, '');
});

test('event bus unsubscribe, once, mutation-safe dispatch, and centralized errors', () => {
  const errors: unknown[] = [];
  const bus = new EventBus((error) => errors.push(error));
  const calls: string[] = [];
  const remove = bus.on('SETTINGS_UPDATED', () => calls.push('removed'));
  remove();
  bus.once('SETTINGS_UPDATED', () => calls.push('once'));
  const throwing = () => { throw new Error('handler failure'); };
  bus.on('SETTINGS_UPDATED', throwing);
  const setting = {} as any;
  bus.emit('SETTINGS_UPDATED', setting);
  bus.emit('SETTINGS_UPDATED', setting);
  assert.deepEqual(calls, ['once']);
  assert.equal(errors.length, 2);
});

test('app lifecycle installs listeners once and removes them on destroy', () => {
  const listeners = new Map<string, Set<() => void>>();
  const target = {
    addEventListener: (name: string, handler: () => void) => {
      if (!listeners.has(name)) listeners.set(name, new Set());
      listeners.get(name)!.add(handler);
    },
    removeEventListener: (name: string, handler: () => void) => listeners.get(name)?.delete(handler),
  };
  const previousWindow = (globalThis as any).window;
  const previousDocument = (globalThis as any).document;
  (globalThis as any).window = target;
  (globalThis as any).document = Object.assign(target, { hidden: false });
  try {
    const bus = new EventBus();
    const logger = new Logger();
    logger.setLevel(LogLevel.NONE);
    const device = { isTizen: () => false } as any;
    const lifecycle = new AppLifecycle(bus, logger, device);
    const observed: string[] = [];
    bus.on(AppLifecycleEvent.FOREGROUND, () => observed.push('foreground'));
    lifecycle.initialize();
    lifecycle.initialize();
    assert.equal(listeners.get('visibilitychange')?.size, 1);
    listeners.get('visibilitychange')?.forEach((listener) => listener());
    assert.deepEqual(observed, ['foreground']);
    lifecycle.destroy();
    assert.equal(listeners.get('visibilitychange')?.size, 0);
    assert.equal(listeners.get('unload')?.size, 0);
  } finally {
    if (previousWindow === undefined) delete (globalThis as any).window;
    else (globalThis as any).window = previousWindow;
    if (previousDocument === undefined) delete (globalThis as any).document;
    else (globalThis as any).document = previousDocument;
  }
});

test('playback manager ignores failures from a superseded prepare request', async () => {
  const pending: Array<{ resolve: () => void; reject: (error: Error) => void }> = [];
  let plays = 0;
  const adapter = {
    prepareStream: () => new Promise<void>((resolve, reject) => pending.push({ resolve, reject })),
    play: () => { plays++; },
    pause: () => {}, seek: () => {}, stop: () => {}, destroy: () => {},
    getState: () => 'IDLE', getPlaybackInfo: () => ({}),
    getAudioTracks: () => [], setAudioTrack: () => {}, getSubtitleTracks: () => [], setSubtitleTrack: () => {},
    addListener: () => () => {}, registerVideoContainer: () => {}, clearVideoContainer: () => {},
  } as any;
  const bus = new EventBus();
  const logger = new Logger();
  logger.setLevel(LogLevel.NONE);
  const manager = new PlaybackManager(bus, logger, {} as any, adapter);
  const errors: unknown[] = [];
  bus.on('PLAYBACK_ERROR', (event) => errors.push(event));
  const media = { id: 'test-media', title: 'test' } as any;
  const stream = { id: 'stream', url: 'https://example.invalid/video.mp4' } as any;

  const first = manager.playStream(stream, media);
  const second = manager.playStream(stream, media);
  pending[0].reject(Object.assign(new Error('superseded'), { name: 'AbortError' }));
  await first;
  pending[1].resolve();
  await second;

  assert.equal(plays, 1);
  assert.deepEqual(errors, []);
  assert.equal(manager.getState(), PlaybackState.PREPARING);
  manager.destroy();
});
