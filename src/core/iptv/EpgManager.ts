import Dexie from 'dexie';
import { iptvDb } from './IptvDatabase';
import { IptvProgram } from './models';
import { Logger } from '../Logger';
import type { IptvChannel } from './models';

export class EpgManager {
  constructor(private logger: Logger) {}

  public async getNowPlaying(tvgId: string, playlistId?: string): Promise<IptvProgram | null> {
    const now = Date.now();
    const programs = playlistId
      ? await iptvDb.programs.where('[playlistId+tvgId+startTime]')
        .between([playlistId, tvgId, Dexie.minKey], [playlistId, tvgId, now], true, true)
        .reverse().limit(25).toArray()
      : await iptvDb.programs.where('[tvgId+startTime]')
        .between([tvgId, Dexie.minKey], [tvgId, now], true, true)
        .reverse().limit(25).toArray();
    return programs.find((program) => program.endTime >= now) ?? null;
  }

  public async getNowPlayingForChannel(channel: Pick<IptvChannel, 'playlistId' | 'tvgId' | 'tvgName' | 'name'>): Promise<IptvProgram | null> {
    const candidates = [channel.tvgId, channel.tvgName, channel.name]
      .map((value) => value?.trim())
      .filter((value, index, values): value is string => !!value
        && values.findIndex((candidate) => candidate?.toLocaleLowerCase() === value.toLocaleLowerCase()) === index);

    for (const candidate of candidates) {
      const program = await this.getNowPlaying(candidate, channel.playlistId);
      if (program) return program;
    }
    return null;
  }

  public async getPrograms(tvgId: string, startTime: number, endTime: number, playlistId?: string, limit = 200): Promise<IptvProgram[]> {
    const safeLimit = Math.max(1, Math.min(500, Math.floor(limit)));
    const upcoming = playlistId
      ? await iptvDb.programs.where('[playlistId+tvgId+startTime]')
        .between([playlistId, tvgId, startTime], [playlistId, tvgId, endTime], true, true).limit(safeLimit).toArray()
      : await iptvDb.programs.where('[tvgId+startTime]')
        .between([tvgId, startTime], [tvgId, endTime], true, true).limit(safeLimit).toArray();
    const current = await this.getCurrentAt(tvgId, startTime, playlistId);
    return [...(current ? [current] : []), ...upcoming]
      .filter((program, index, records) => program.endTime >= startTime && records.findIndex((entry) => entry.id === program.id) === index)
      .sort((left, right) => left.startTime - right.startTime)
      .slice(0, safeLimit);
  }

  public async getUpcoming(tvgId: string, fromTime = Date.now(), limit = 5, playlistId?: string): Promise<IptvProgram[]> {
    const safeLimit = Math.max(1, Math.min(20, Math.floor(limit)));
    return playlistId
      ? iptvDb.programs.where('[playlistId+tvgId+startTime]')
        .between([playlistId, tvgId, fromTime], [playlistId, tvgId, Dexie.maxKey], true, true)
        .limit(safeLimit).toArray()
      : iptvDb.programs.where('[tvgId+startTime]')
        .between([tvgId, fromTime], [tvgId, Dexie.maxKey], true, true)
        .limit(safeLimit).toArray();
  }

  private async getCurrentAt(tvgId: string, time: number, playlistId?: string): Promise<IptvProgram | null> {
    const programs = playlistId
      ? await iptvDb.programs.where('[playlistId+tvgId+startTime]')
        .between([playlistId, tvgId, Dexie.minKey], [playlistId, tvgId, time], true, true)
        .reverse().limit(25).toArray()
      : await iptvDb.programs.where('[tvgId+startTime]')
        .between([tvgId, Dexie.minKey], [tvgId, time], true, true)
        .reverse().limit(25).toArray();
    return programs.find((program) => program.endTime >= time) ?? null;
  }

  public async clearEpg(playlistId: string): Promise<void> {
    await iptvDb.programs.where('playlistId').equals(playlistId).delete();
  }

  public async savePrograms(programs: IptvProgram[]): Promise<void> {
    await iptvDb.programs.bulkPut(programs);
  }
}
