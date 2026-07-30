import { IptvChannel, IptvProgram } from './models';
import { Logger } from '../Logger';

export class ParserEngine {
  constructor(private logger: Logger) {}

  public async parseM3u(m3uContent: string, playlistId: string): Promise<IptvChannel[]> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(new URL('./m3u.worker.ts', import.meta.url), {
        type: 'module'
      });
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
    return new Promise((resolve, reject) => {
      const worker = new Worker(new URL('./xmltv.worker.ts', import.meta.url), {
        type: 'module'
      });
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
