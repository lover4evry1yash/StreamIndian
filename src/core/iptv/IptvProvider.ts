import { IStreamProvider, ProviderContext, ProviderStatus, ProviderHealth, ProviderCapabilities } from '../providers/types';
import { IptvManager } from './IptvManager';
import { StreamPresentationModel, PlaybackReadiness } from '../../types/tizen';

export class IptvProvider implements IStreamProvider {
  public readonly id = 'iptv_provider';
  public readonly name = 'IPTV Core Provider';
  public readonly version = '1.0.0';
  public readonly priority = 1; // High priority for live TV
  public enabled = true;
  
  public readonly capabilities: ProviderCapabilities = {
    supportsStreams: true,
  };

  public status = ProviderStatus.UNINITIALIZED;

  constructor(private iptvManager: IptvManager) {}

  public async initialize(context: ProviderContext): Promise<void> {
    this.status = ProviderStatus.READY;
  }

  public async shutdown(): Promise<void> {
    this.status = ProviderStatus.UNINITIALIZED;
  }

  public async healthCheck(): Promise<ProviderHealth> {
    return {
      status: this.status,
      availability: 1,
      latency: 0,
      lastSuccessfulRequest: Date.now(),
      errorCount: 0
    };
  }

  public async getStreams(mediaId: string, type: 'movie' | 'episode' | 'live', season?: number, episode?: number): Promise<any[]> {
    if (type !== 'live') {
      return []; // Only handles live TV
    }

    // Example mediaId format: iptv_{playlistId}_{channelId}
    const [_, playlistId, channelId] = mediaId.split('_');

    if (!playlistId || !channelId) return [];

    const channel = await this.iptvManager.getChannelById(channelId);
    if (!channel) return [];

    return [{
      id: channel.id,
      title: channel.name,
      quality: 'HD',
      format: 'HLS', // Default assumption, can check extension
      providerName: this.name,
      readiness: PlaybackReadiness.DIRECT,
      isLegalPublicStream: true,
      streamSource: { url: channel.streamUrl }
    }];
  }
}
