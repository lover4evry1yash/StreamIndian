import { iptvDb } from './IptvDatabase';
import { IptvPlaylist, IptvChannel, IptvProgram } from './models';
import { ParserEngine } from './ParserEngine';
import { XtreamClient } from './XtreamClient';
import { EpgManager } from './EpgManager';
import { UserDataManager } from './UserDataManager';
import { NetworkClient } from '../NetworkClient';
import { Logger } from '../Logger';

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
      id: crypto.randomUUID(),
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
    let isSuccess = false;

    try {
      if (playlist.type === 'xtream') {
        const authed = await this.xtreamClient.authenticate(playlist);
        if (!authed) throw new Error('Xtream authentication failed');
        channels = await this.xtreamClient.fetchLiveStreams(playlist);
      } else if (playlist.type === 'm3u') {
        let content = localFileContent;
        if (!content && playlist.url) {
          const response = await this.network.fetch(playlist.url);
          content = await response.text();
        }
        if (!content) throw new Error('No M3U content available');
        channels = await this.parserEngine.parseM3u(content, playlistId);
      }

      if (channels.length > 0) {
        await iptvDb.transaction('rw', iptvDb.channels, async () => {
          const existing = await iptvDb.channels.where('playlistId').equals(playlistId).toArray();
          const existingMap = new Map(existing.map(c => [c.streamUrl, c])); 

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
      }

      if (playlist.epgUrl) {
         try {
            const response = await this.network.fetch(playlist.epgUrl);
            const content = await response.text();
            const programs = await this.parserEngine.parseXmltv(content, playlistId);
            await this.epgManager.clearEpg(playlistId);
            await this.epgManager.savePrograms(programs);
         } catch (e) {
            this.logger.error('Failed to parse EPG', e);
         }
      }

      isSuccess = true;
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
    return iptvDb.channels
      .where('[playlistId+group]')
      .equals([playlistId, group])
      .offset(offset)
      .limit(limit)
      .toArray();
  }

  public async searchChannels(query: string, limit = 50): Promise<IptvChannel[]> {
    const lowerQuery = query.toLowerCase();
    const all = await iptvDb.channels.toArray();
    return all.filter(c => c.name.toLowerCase().includes(lowerQuery)).slice(0, limit);
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
