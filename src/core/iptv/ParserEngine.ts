import { IptvChannel, IptvProgram } from './models';
import { Logger } from '../Logger';
import { parseM3uContent, parseXmltvContent } from './parsers';

export class ParserEngine {
  constructor(private logger: Logger) {}

  public async parseM3u(m3uContent: string, playlistId: string): Promise<IptvChannel[]> {
    if (typeof Worker === 'undefined') {
      this.logger.warn('Module workers are unavailable; parsing the M3U playlist on the main thread');
      return parseM3uContent(m3uContent, playlistId);
    }

    return new Promise((resolve, reject) => {
      let worker: Worker;
      try {
        worker = new Worker(new URL('./m3u.worker.ts', import.meta.url), { type: 'module' });
      } catch (error) {
        this.logger.warn('M3U worker could not be started; parsing on the main thread', error);
        try { resolve(parseM3uContent(m3uContent, playlistId)); }
        catch (fallbackError) { reject(fallbackError); }
        return;
      }
      worker.onmessage = (event) => {
        const { type, channels, error } = event.data;
        if (type === 'success') {
          resolve(channels);
        } else {
          reject(new Error(error));
        }
        worker.terminate();
      };
      worker.onerror = (error) => {
        reject(error);
        worker.terminate();
      };
      worker.postMessage({ m3uContent, playlistId });
    });
  }

  public async parseXmltv(xmlContent: string, playlistId: string): Promise<IptvProgram[]> {
    if (typeof Worker === 'undefined') {
      this.logger.warn('Module workers are unavailable; parsing XMLTV on the main thread');
      return parseXmltvContent(xmlContent, playlistId);
    }

    return new Promise((resolve, reject) => {
      let worker: Worker;
      try {
        worker = new Worker(new URL('./xmltv.worker.ts', import.meta.url), { type: 'module' });
      } catch (error) {
        this.logger.warn('XMLTV worker could not be started; parsing on the main thread', error);
        try { resolve(parseXmltvContent(xmlContent, playlistId)); }
        catch (fallbackError) { reject(fallbackError); }
        return;
      }
      worker.onmessage = (event) => {
        const { type, programs, error } = event.data;
        if (type === 'success') {
          resolve(programs);
        } else {
          reject(new Error(error));
        }
        worker.terminate();
      };
      worker.onerror = (error) => {
        reject(error);
        worker.terminate();
      };
      worker.postMessage({ xmlContent, playlistId });
    });
  }
}
