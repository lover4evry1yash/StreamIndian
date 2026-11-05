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

    // Identifiers use a delimiter that cannot collide with generated playlist/channel IDs.
    const prefix = 'iptv:';
    if (!mediaId.startsWith(prefix)) return [];
    const separator = mediaId.indexOf(':', prefix.length);
    if (separator < 0) return [];
    const playlistId = mediaId.slice(prefix.length, separator);
    const channelId = mediaId.slice(separator + 1);

    if (!playlistId || !channelId) return [];

    const channel = await this.iptvManager.getChannelById(channelId);
    if (!channel || channel.playlistId !== playlistId) return [];

    return [{
      id: channel.id,
      title: channel.name,
      quality: 'Unknown',
      format: channel.streamUrl.toLowerCase().includes('.m3u8') ? 'HLS'
        : channel.streamUrl.toLowerCase().includes('.mpd') ? 'DASH'
          : channel.streamUrl.toLowerCase().includes('.ts') ? 'TS' : 'UNKNOWN',
      providerName: this.name,
      readiness: PlaybackReadiness.DIRECT,
      isLegalPublicStream: false,
      streamSource: { url: channel.streamUrl }
    }];
  }
}
