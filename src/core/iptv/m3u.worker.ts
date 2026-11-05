import { parseM3uContent } from './parsers';

self.addEventListener('message', (event: MessageEvent<{ m3uContent: string; playlistId: string }>) => {
  try {
    const channels = parseM3uContent(event.data.m3uContent, event.data.playlistId);
    self.postMessage({ type: 'success', channels });
  } catch (error) {
    self.postMessage({ type: 'error', error: error instanceof Error ? error.message : String(error) });
  }
});
