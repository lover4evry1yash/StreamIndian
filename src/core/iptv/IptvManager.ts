import { iptvDb } from './IptvDatabase';
import { IptvPlaylist, IptvChannel, IptvProgram } from './models';
import { ParserEngine } from './ParserEngine';
import { XtreamClient } from './XtreamClient';
import { EpgManager } from './EpgManager';
import { UserDataManager } from './UserDataManager';
import { NetworkClient } from '../NetworkClient';
import { Logger } from '../Logger';
import { createId } from '../createId';

const MAX_IPTV_RESPONSE_BYTES = 32 * 1024 * 1024;

export class IptvManager {
  private parserEngine: ParserEngine;
  public xtreamClient: XtreamClient;
  public epgManager: EpgManager;
  public userDataManager: UserDataManager;

  constructor(
    private network: NetworkClient,
    private logger: Logger
  ) {
    this.parserEngine = new ParserEngine(logger);
    this.xtreamClient = new XtreamClient(network, logger);
    this.epgManager = new EpgManager(logger);
    this.userDataManager = new UserDataManager();
  }

  public async addPlaylist(playlist: Omit<IptvPlaylist, 'id' | 'lastUpdated' | 'refreshFailures' | 'channelCount'>): Promise<IptvPlaylist> {
    const newPlaylist: IptvPlaylist = {
      ...playlist,
      id: createId(),
      lastUpdated: 0,
      refreshFailures: 0,
      channelCount: 0
    };

    await iptvDb.playlists.add(newPlaylist);
    return newPlaylist;
  }

  public async getPlaylists(): Promise<IptvPlaylist[]> {
    return iptvDb.playlists.toArray();
  }

  public async deletePlaylist(playlistId: string): Promise<void> {
    await iptvDb.transaction('rw', iptvDb.playlists, iptvDb.channels, iptvDb.programs, async () => {
      await iptvDb.playlists.delete(playlistId);
      await iptvDb.channels.where('playlistId').equals(playlistId).delete();
      await iptvDb.programs.where('playlistId').equals(playlistId).delete();
    });
  }

  public async refreshPlaylist(playlistId: string, localFileContent?: string): Promise<void> {
    const playlist = await iptvDb.playlists.get(playlistId);
    if (!playlist) throw new Error('Playlist not found');

    this.logger.info(`Refreshing playlist: ${playlist.name}`);

    let channels: IptvChannel[] = [];
    try {
      if (playlist.type === 'xtream') {
        const authed = await this.xtreamClient.authenticate(playlist);
        if (!authed) throw new Error('Xtream authentication failed');
        const categories = await this.xtreamClient.fetchCategories(playlist, 'live');
        const categoryNames = new Map(categories.map((category) => [String(category.category_id), String(category.category_name ?? '')]));
        channels = (await this.xtreamClient.fetchLiveStreams(playlist)).map((channel) => ({
          ...channel,
          group: categoryNames.get(channel.group) || channel.group || 'Uncategorized',
        }));
      } else if (playlist.type === 'm3u') {
        let content = localFileContent;
        if (!content && playlist.url) {
          content = await this.network.getText(playlist.url, { maxResponseBytes: MAX_IPTV_RESPONSE_BYTES });
        }
        if (!content) throw new Error('No M3U content available');
        channels = await this.parserEngine.parseM3u(content, playlistId);
      }

      if (channels.length === 0) throw new Error('Playlist returned no live channels; existing channel data was preserved');
      await iptvDb.transaction('rw', iptvDb.channels, async () => {
          const existingMap = new Map<string, Pick<IptvChannel, 'isFavorite' | 'isHidden'>>();
          await iptvDb.channels.where('playlistId').equals(playlistId).each((channel) => {
            existingMap.set(channel.streamUrl, { isFavorite: channel.isFavorite, isHidden: channel.isHidden });
          });

          const newChannels = channels.map(c => {
            const match = existingMap.get(c.streamUrl);
            if (match) {
              c.isFavorite = match.isFavorite;
              c.isHidden = match.isHidden;
            }
            return c;
          });

          await iptvDb.channels.where('playlistId').equals(playlistId).delete();
          await iptvDb.channels.bulkPut(newChannels);
      });

      if (playlist.epgUrl) {
         try {
            const content = await this.network.getText(playlist.epgUrl, { maxResponseBytes: MAX_IPTV_RESPONSE_BYTES });
            const programs = await this.parserEngine.parseXmltv(content, playlistId);
            await this.epgManager.clearEpg(playlistId);
            await this.epgManager.savePrograms(programs);
         } catch (e) {
            this.logger.error('Failed to parse EPG', e);
         }
      }

      await iptvDb.playlists.update(playlistId, { 
        lastUpdated: Date.now(),
        refreshFailures: 0,
        channelCount: channels.length
      });
      this.logger.info(`Refreshed ${channels.length} channels for playlist ${playlist.name}`);
    } catch (error) {
      this.logger.error(`Failed to refresh playlist ${playlist.name}`, error);
      const currentFailures = playlist.refreshFailures || 0;
      await iptvDb.playlists.update(playlistId, {
        refreshFailures: currentFailures + 1
      });
      throw error;
    }
  }

  public async getChannelById(channelId: string): Promise<IptvChannel | undefined> {
    return iptvDb.channels.get(channelId);
  }

  public async getChannelsByGroup(playlistId: string, group: string, limit = 50, offset = 0): Promise<IptvChannel[]> {
    const safeLimit = Math.max(1, Math.min(200, Math.floor(limit)));
    const safeOffset = Math.max(0, Math.floor(offset));
    return iptvDb.channels
      .where('[playlistId+group]')
      .equals([playlistId, group])
      .filter((channel) => !channel.isHidden)
      .offset(safeOffset)
      .limit(safeLimit)
      .toArray();
  }

  public async getChannelGroups(playlistId: string): Promise<string[]> {
    const groups = new Set<string>();
    await iptvDb.channels.where('playlistId').equals(playlistId).each((channel) => {
      if (!channel.isHidden && groups.size < 1000) groups.add(channel.group || 'Uncategorized');
    });
    return [...groups].sort((left, right) => left.localeCompare(right));
  }

  public async searchChannels(query: string, limit = 50, playlistId?: string): Promise<IptvChannel[]> {
    const lowerQuery = query.toLowerCase();
    const safeLimit = Math.max(1, Math.min(200, Math.floor(limit)));
    const channels = playlistId
      ? iptvDb.channels.where('playlistId').equals(playlistId)
      : iptvDb.channels.toCollection();
    return channels
      .filter((channel) => !channel.isHidden && channel.name.toLowerCase().includes(lowerQuery))
      .limit(safeLimit)
      .toArray();
  }

  public async getDiagnostics(playlistId: string) {
    const playlist = await iptvDb.playlists.get(playlistId);
    if (!playlist) return null;

    const channelCount = playlist.channelCount || 0;
    const epgCount = await iptvDb.programs.where('playlistId').equals(playlistId).count();

    return {
      playlistId,
      isValid: channelCount > 0,
      channelCount,
      epgStatus: epgCount > 0 ? `Active (${epgCount} programs)` : 'None',
      lastRefresh: playlist.lastUpdated,
      refreshFailures: playlist.refreshFailures || 0
    };
  }
}
