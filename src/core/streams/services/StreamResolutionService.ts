import { StreamSource, PlaybackReadiness } from '../../../types/tizen';
import { CanonicalStreamSource, StreamSortOptions } from '../types';
import { ResolutionManager } from '../ResolutionManager';
import { DebridManager } from '../debrid/DebridManager';
import { TransferManager } from '../debrid/TransferManager';

export class StreamResolutionService {
  private resolutionManager: ResolutionManager;
  private debridManager: DebridManager;
  private transferManager: TransferManager;

  constructor(
    resolutionManager: ResolutionManager,
    debridManager: DebridManager,
    transferManager: TransferManager
  ) {
    this.resolutionManager = resolutionManager;
    this.debridManager = debridManager;
    this.transferManager = transferManager;
  }

  public async resolve(sources: CanonicalStreamSource[], options?: StreamSortOptions): Promise<StreamSource[]> {
    // We pass options here if ResolutionManager still needs it for initial direct fallback mapping,
    // though the sorting will actually happen in StreamSortingService afterwards.
    console.log(`[StreamResolutionService] Input canonical count: ${sources.length}`);
    const results = await this.resolutionManager.resolve(sources);
    console.log(`[StreamResolutionService] Output StreamSource count: ${results.length}`);
    return results;
  }

  public async prepareStream(
    stream: StreamSource,
    onProgress?: (progress: number, message: string) => void
  ): Promise<StreamSource | null> {
    const isDirectHttp = stream.url && (stream.url.startsWith('http://') || stream.url.startsWith('https://') || stream.url.startsWith('blob:'));
    const needsDebrid = stream.readiness === PlaybackReadiness.DEBRID_REQUIRED || 
                         stream.readiness === PlaybackReadiness.DIRECT_TORRENT || 
                         !isDirectHttp;

    if (!needsDebrid) {
        return stream;
    }

    const infoHash = (stream as any).streamSource?.infoHash || 
                      (stream.url && stream.url.includes('btih:') ? stream.url.split('btih:')[1]?.split('&')[0] : null);
                      
    if (!infoHash) {
        console.error('[StreamResolutionService] Debrid resolution requested but source has no torrent identifier.');
        return null;
    }

    const magnet = (stream as any).streamSource?.magnet || (stream.url?.startsWith('magnet:') ? stream.url : undefined);
    
    if (onProgress) onProgress(10, 'Initiating Debrid Transfer...');
    
    await this.transferManager.initiateTransfer(infoHash, magnet);
    
    if (onProgress) onProgress(50, 'Resolving Debrid Stream...');
    
    const fileIndex = (stream as any).streamSource?.fileIndex;
    console.log('[StreamResolutionService] TorBox resolving infoHash:', !!infoHash);
    const resolved = await this.debridManager.resolve(infoHash, undefined, fileIndex);
    console.log('[StreamResolutionService] TorBox resolution success:', !!resolved, 'url exists:', !!resolved?.url);
    
    if (onProgress) onProgress(100, 'Stream ready!');
    await new Promise(r => setTimeout(r, 300));
    
    const finalUrl = resolved?.url || '';
    
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      return null;
    }

    return {
      ...stream,
      url: finalUrl,
      readiness: PlaybackReadiness.DEBRID_CACHED as PlaybackReadiness
    };
  }
}
