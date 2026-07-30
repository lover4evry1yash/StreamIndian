import { ProviderContext } from "../../../providers/types";
import { ProviderHealth, ProviderStatus, ProviderCapabilities } from '../../../providers/types';
import { IDebridProvider, DebridProviderHealth, TransferResult, TransferStatus, DebridLimits, DebridDiagnostics } from '../types';

export class TorBoxDebridProvider implements IDebridProvider {
  public readonly id = 'torbox';
  public readonly name = 'TorBox';
  public readonly priority: number;
  public readonly version = '1.0.0';
  public readonly enabled = true;
  public readonly status = ProviderStatus.READY;
  public readonly capabilities: ProviderCapabilities = {
    supportsStreams: true
  };

  private apiKey: string;
  private isAvailable: boolean = true;
  private latencyMs: number = 45;
  private reliability: number = 99;
  private failureCount: number = 0;
  private totalResolutions: number = 0;
  private cacheHits: number = 0;

  constructor(apiKey: string = '', priority: number = 100) {
    this.apiKey = apiKey;
    this.priority = priority;
  }

  public async initialize(context: ProviderContext): Promise<void> {
    if (context && context.settingsManager) {
      this.apiKey = context.settingsManager.getSettings().streams?.torboxApiKey || '';
    }
    this.isAvailable = !!this.apiKey;
  }

  public async shutdown(): Promise<void> {}
  
  public async healthCheck(): Promise<ProviderHealth> {
    return {
      status: this.isAvailable ? ProviderStatus.READY : ProviderStatus.UNAVAILABLE,
      availability: this.isAvailable ? 1 : 0,
      latency: this.latencyMs,
      lastSuccessfulRequest: Date.now(),
      errorCount: this.failureCount
    };
  }

  public getHealth(): DebridProviderHealth {
    return {
      isAvailable: this.isAvailable,
      latencyMs: this.latencyMs,
      reliability: this.reliability,
      failureCount: this.failureCount,
      averageResolveTimeMs: 120,
      averageTransferTimeMs: 2500,
      lastSuccessfulOperation: Date.now()
    };
  }

  private async apiRequest(endpoint: string, method: string = 'GET', body?: unknown) {
    if (!this.apiKey) throw new Error('TorBox API Key not configured');
    const url = endpoint.startsWith('http') ? endpoint : `https://api.torbox.app/v1/api${endpoint}`;
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`
    };

    let fetchBody: BodyInit | undefined;
    if (body) {
      if (body instanceof FormData) {
        fetchBody = body;
      } else {
        headers['Content-Type'] = 'application/json';
        fetchBody = JSON.stringify(body);
      }
    }

    const start = Date.now();
    try {
      const res = await fetch(url, { method, headers, body: fetchBody });
      this.latencyMs = (this.latencyMs + (Date.now() - start)) / 2;
      
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      const data = await res.json();
      if (!data.success && data.error) throw new Error(data.error);
      return data;
    } catch (e) {
      this.failureCount++;
      throw e;
    }
  }

  public async checkCache(infoHashes: string[]): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    if (!this.isAvailable || infoHashes.length === 0) return results;

    infoHashes.forEach(h => results[h] = false);

    try {
      const hashList = infoHashes.join(',');
      const data = await this.apiRequest(`/torrents/checkcached?hash=${hashList}&format=list`);
      
      if (data && data.data) {
        if (Array.isArray(data.data)) {
           for (const item of data.data) {
              if (item && item.hash) {
                 results[item.hash.toLowerCase()] = true;
                 this.cacheHits++;
              }
           }
        } else if (typeof data.data === 'object') {
           for (const key of Object.keys(data.data)) {
              results[key.toLowerCase()] = true;
              this.cacheHits++;
           }
        }
      }
    } catch (e) {
      console.warn('[TorBox] Cache check failed:', e);
    }
    return results;
  }

  public async createTransfer(infoHash: string, magnet?: string): Promise<TransferResult> {
    const isCached = (await this.checkCache([infoHash]))[infoHash.toLowerCase()];
    if (isCached) {
      return { transferId: infoHash, status: 'cached', progress: 100 }; // For cached, hash is enough
    }

    if (!magnet) {
      magnet = `magnet:?xt=urn:btih:${infoHash}`;
    }

    const formData = new FormData();
    formData.append('magnet', magnet);

    try {
      const data = await this.apiRequest(`/torrents/createtorrent`, 'POST', formData);
      if (data && data.data && data.data.torrent_id) {
         return { transferId: data.data.torrent_id.toString(), status: 'downloading', progress: 0 };
      }
      throw new Error('No torrent_id returned from TorBox');
    } catch (e) {
      console.error('[TorBox] createTransfer failed:', e);
      return { transferId: '', status: 'error', progress: 0 };
    }
  }

  public async pollTransfer(transferId: string): Promise<TransferStatus> {
    try {
      // If it was instantly cached, we just returned infoHash as transferId, check it here
      if (!/^[0-9]+$/.test(transferId)) {
         return { transferId, status: 'cached', progress: 100 }; 
      }

      const data = await this.apiRequest(`/torrents/mylist`);
      if (data && data.data && Array.isArray(data.data)) {
         const torrent = data.data.find((t: Record<string, any>) => t.id.toString() === transferId);
         if (torrent) {
            const isCompleted = torrent.download_state === 'completed' || torrent.download_state === 'cached';
            const isError = torrent.download_state === 'error';
            return {
               transferId,
               status: isCompleted ? 'cached' : isError ? 'error' : 'downloading',
               progress: torrent.progress * 100,
               downloadSpeed: torrent.download_speed,
               timeRemaining: torrent.eta
            };
         }
      }
    } catch (e) {
       console.warn('[TorBox] pollTransfer failed:', e);
    }
    return { transferId, status: 'downloading', progress: 0 };
  }

  public async resolve(infoHash: string, fileIndex?: number): Promise<string | null> {
    this.totalResolutions++;
    try {
      const listData = await this.apiRequest(`/torrents/mylist`);
      let torrent: any = null;
      if (listData && listData.data && Array.isArray(listData.data)) {
         torrent = listData.data.find((t: Record<string, any>) => t.hash.toLowerCase() === infoHash.toLowerCase());
      }

      if (!torrent) {
          // If we can't find it in mylist, maybe it's not added yet, or we need to add it?
          // Since it's cached, we can just add it and get it immediately.
          const addData = await this.apiRequest('/torrents/createtorrent', 'POST', (() => {
              const fd = new FormData();
              fd.append('magnet', `magnet:?xt=urn:btih:${infoHash}`);
              return fd;
          })());
          
          if (addData && addData.data && addData.data.torrent_id) {
              const refreshListData = await this.apiRequest(`/torrents/mylist`);
              torrent = refreshListData?.data?.find((t: Record<string, any>) => t.id === addData.data.torrent_id);
          }
      }

      if (torrent && torrent.files && torrent.files.length > 0) {
         let selectedFile: any = null;
         
         if (fileIndex !== undefined) {
             // Stremio fileIdx may correspond to an index. Need to find matching ID or just use it.
             // Usually, TorBox files are returned as an array, but the API may have its own file IDs.
             // We'll try to find the file that matches the provided fileIndex. 
             // (Assuming Stremio fileIdx corresponds to the array index of the torrent's files)
             // If not, we'll fallback to the largest file.
             
             // First try direct index match if it aligns
             if (torrent.files[fileIndex]) {
                 selectedFile = torrent.files[fileIndex];
             } 
         }
         
         if (!selectedFile) {
             // Fallback: Find largest file
             selectedFile = torrent.files.reduce((prev: any, current: any) => {
                return (prev.size > current.size) ? prev : current;
             });
         }
         
         const dlData = await this.apiRequest(`/torrents/requestdl?token=${this.apiKey}&torrent_id=${torrent.id}&file_id=${selectedFile.id}`);
         if (dlData && dlData.data) {
             return dlData.data;
         }
      }
    } catch (e) {
      console.error('[TorBox] resolve failed:', e);
    }
    return null;
  }

  public async cancel(transferId: string): Promise<boolean> {
    throw new Error('NotSupportedError: TorBox cancel operation is not implemented yet.');
  }

  public getLimits(): DebridLimits {
    return { concurrentTransfers: 5, maxFileSize: 100000000000 };
  }

  public getDiagnostics(): DebridDiagnostics {
    return {
      id: this.id,
      name: this.name,
      health: this.getHealth(),
      totalResolutions: this.totalResolutions,
      cacheHitRate: this.totalResolutions > 0 ? (this.cacheHits / this.totalResolutions) * 100 : 100
    };
  }
}
