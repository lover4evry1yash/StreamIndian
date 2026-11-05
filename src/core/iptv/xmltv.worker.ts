import { parseXmltvContent } from './parsers';

self.addEventListener('message', (event: MessageEvent<{ xmlContent: string; playlistId: string }>) => {
  try {
    const programs = parseXmltvContent(event.data.xmlContent, event.data.playlistId);
    self.postMessage({ type: 'success', programs });
  } catch (error) {
    self.postMessage({ type: 'error', error: error instanceof Error ? error.message : String(error) });
  }
});
