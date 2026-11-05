import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AVPlayManager } from './avplay';
import { AVPlayPlayerState, type StreamSource } from '../types/tizen';
import { EventBus } from './EventBus';
import { Logger } from './Logger';
import { PlaybackManager } from './playback/PlaybackManager';
import { PlaybackState } from './playback/types';

const stream: StreamSource = {
  id: 'test-stream',
  quality: '1080p FHD',
  format: 'HLS',
  url: 'https://media.example/stream.m3u8',
  isLegalPublicStream: true,
  providerName: 'test',
};

function createNativeApi() {
  let callbacks: Record<string, (...args: any[]) => void> = {};
  const preparations: Array<{ success: () => void; failure: (error: unknown) => void }> = [];
  const calls: string[] = [];
  const api = {
    open: () => calls.push('open'),
    setDisplayRect: () => calls.push('rect'),
    setStreamingProperty: () => calls.push('streaming-property'),
    setListener: (listener: Record<string, (...args: any[]) => void>) => { callbacks = listener; },
    prepareAsync: (success: () => void, failure: (error: unknown) => void) => {
      preparations.push({ success, failure });
    },
    getDuration: () => 120000,
    seekTo: () => calls.push('seek'),
    play: () => calls.push('play'),
    pause: () => calls.push('pause'),
    stop: () => calls.push('stop'),
    close: () => calls.push('close'),
    getTotalTrackInfo: () => [{ type: 'AUDIO', index: 1, extra_info: { language: 'en' } }],
    setSelectTrack: () => calls.push('track'),
    setVolume: () => calls.push('volume'),
    getVolume: () => 50,
  };
  return {
    api,
    calls,
    succeed: (index = preparations.length - 1) => preparations[index]?.success(),
    fail: (error: unknown, index = preparations.length - 1) => preparations[index]?.failure(error),
    emit: (name: string, ...args: any[]) => callbacks[name]?.(...args),
  };
}

async function withWindow<T>(run: () => Promise<T>): Promise<T> {
  const previous = (globalThis as any).window;
  (globalThis as any).window = {
    innerWidth: 1920,
    innerHeight: 1080,
    webapis: { audiocontrol: { setOutputMode: () => {} } },
  };
  try { return await run(); } finally {
    if (previous === undefined) delete (globalThis as any).window;
    else (globalThis as any).window = previous;
  }
}

test('AVPlay adapter prepares, transitions, reports tracks, controls volume, and tears down', async () => {
  await withWindow(async () => {
    const native = createNativeApi();
    const manager = new AVPlayManager({ nativeApi: native.api as any, prepareTimeoutMs: 50 });
    const prepared = manager.prepareStream(stream, 5);
    native.succeed();
    await prepared;

    assert.equal(manager.getState(), AVPlayPlayerState.PREPARED);
    assert.equal(manager.getPlaybackInfo().duration, 120);
    assert.equal(manager.getPlaybackInfo().currentTime, 5);
    assert.equal(manager.getAudioTracks()[0]?.language, 'en');
    manager.setVolume(0.5);
    manager.seek(10);
    manager.play();
    manager.pause();
    assert.deepEqual(native.calls.filter((call) => ['seek', 'play', 'pause', 'volume'].includes(call)), ['seek', 'volume', 'seek', 'play', 'pause']);

    manager.stop();
    manager.destroy();
    assert.ok(native.calls.includes('close'));
  });
});

test('playback manager publishes its startup state machine through READY and PLAYING', async () => {
  await withWindow(async () => {
    const native = createNativeApi();
    const adapter = new AVPlayManager({ nativeApi: native.api as any, prepareTimeoutMs: 50 });
    const bus = new EventBus();
    const logger = new Logger();
    const manager = new PlaybackManager(bus, logger, {} as any, adapter);
    const states: PlaybackState[] = [];
    bus.on('PLAYBACK_STATE_CHANGED', ({ state }) => states.push(state));
    const media = { id: 'media', title: 'test' } as any;
    const play = manager.playStream(stream, media);
    native.succeed();
    await play;

    assert.deepEqual(states.slice(0, 5), [
      PlaybackState.RESOLVING,
      PlaybackState.INITIALIZING,
      PlaybackState.PREPARING,
      PlaybackState.READY,
      PlaybackState.PLAYING,
    ]);
    manager.destroy();
  });
});

test('native AVPlay errors propagate once through the playback manager', async () => {
  await withWindow(async () => {
    const native = createNativeApi();
    const adapter = new AVPlayManager({ nativeApi: native.api as any, prepareTimeoutMs: 50 });
    const bus = new EventBus();
    const logger = new Logger();
    const manager = new PlaybackManager(bus, logger, {} as any, adapter);
    let errorCount = 0;
    bus.on('PLAYBACK_STATE_CHANGED', ({ state }) => {
      if (state === PlaybackState.ERROR) errorCount++;
    });
    const play = manager.playStream(stream, { id: 'media', title: 'test' } as any);
    native.emit('onerror', new Error('native failure'));
    await play;
    assert.equal(errorCount, 1);
    assert.equal(manager.getState(), PlaybackState.ERROR);
    manager.destroy();
  });
});

test('AVPlay preparation failure and timeout enter ERROR', async () => {
  await withWindow(async () => {
    const native = createNativeApi();
    const manager = new AVPlayManager({ nativeApi: native.api as any, prepareTimeoutMs: 5 });
    const failure = manager.prepareStream(stream);
    native.fail(new Error('prepare failed'));
    await assert.rejects(failure, /prepare failed/);
    assert.equal(manager.getState(), AVPlayPlayerState.ERROR);

    const timeoutManager = new AVPlayManager({ nativeApi: createNativeApi().api as any, prepareTimeoutMs: 5 });
    await assert.rejects(timeoutManager.prepareStream(stream), /timed out/);
    assert.equal(timeoutManager.getState(), AVPlayPlayerState.ERROR);
    timeoutManager.destroy();
    manager.destroy();
  });
});

test('AVPlay ignores callbacks from replaced sessions and cancels pending preparation', async () => {
  await withWindow(async () => {
    const native = createNativeApi();
    const manager = new AVPlayManager({ nativeApi: native.api as any, prepareTimeoutMs: 50 });
    const oldPrepare = manager.prepareStream(stream);
    const oldResult = assert.rejects(oldPrepare, { name: 'AbortError' });
    const newPrepare = manager.prepareStream({ ...stream, id: 'new-session' });
    await oldResult;
    native.succeed(0);
    assert.equal(manager.getState(), AVPlayPlayerState.IDLE);
    native.succeed(1);
    await newPrepare;
    assert.equal(manager.getState(), AVPlayPlayerState.PREPARED);
    manager.destroy();
  });
});

test('AVPlay stop aborts pending preparation and is safe when repeated', async () => {
  await withWindow(async () => {
    const native = createNativeApi();
    const manager = new AVPlayManager({ nativeApi: native.api as any, prepareTimeoutMs: 50 });
    const pending = manager.prepareStream(stream);
    const rejected = assert.rejects(pending, { name: 'AbortError' });
    manager.stop();
    await rejected;
    manager.stop();
    assert.equal(manager.getState(), AVPlayPlayerState.STOPPED);
    manager.destroy();
  });
});

test('HTML video fallback removes pending media listeners when the adapter is destroyed', async () => {
  const listeners = new Map<string, Set<EventListener>>();
  const video = {
    currentTime: 0,
    duration: 0,
    volume: 1,
    muted: false,
    readyState: 0,
    networkState: 0,
    error: null,
    src: '',
    canPlayType: () => '',
    addEventListener: (name: string, handler: EventListener) => {
      if (!listeners.has(name)) listeners.set(name, new Set());
      listeners.get(name)!.add(handler);
    },
    removeEventListener: (name: string, handler: EventListener) => listeners.get(name)?.delete(handler),
    removeAttribute: (name: string) => { if (name === 'src') video.src = ''; },
    load: () => {},
    pause: () => {},
    play: async () => {},
  } as any as HTMLVideoElement;
  const manager = new AVPlayManager({ nativeApi: null, prepareTimeoutMs: 50 });
  manager.registerVideoContainer(video);
  const preparing = manager.prepareStream({ ...stream, format: 'MP4', url: 'https://media.example/video.mp4' });
  const rejected = assert.rejects(preparing, { name: 'AbortError' });
  assert.equal(listeners.get('loadedmetadata')?.size, 1);
  assert.equal(listeners.get('error')?.size, 1);

  manager.destroy();
  await rejected;
  assert.equal(listeners.get('loadedmetadata')?.size, 0);
  assert.equal(listeners.get('error')?.size, 0);
  assert.equal(video.onended, null);
  assert.equal(video.onerror, null);
});
