import { iptvDb } from './IptvDatabase';
import { IptvProgram } from './models';
import { Logger } from '../Logger';

export class EpgManager {
  constructor(private logger: Logger) {}

  public async getNowPlaying(tvgId: string): Promise<IptvProgram | null> {
    const now = Date.now();
    
    // Find a program that started before 'now' and ends after 'now'
    const programs = await iptvDb.programs
      .where('tvgId')
      .equals(tvgId)
      .toArray();

    return programs.find(p => p.startTime <= now && p.endTime >= now) || null;
  }

  public async getPrograms(tvgId: string, startTime: number, endTime: number): Promise<IptvProgram[]> {
    return iptvDb.programs
      .where('tvgId')
      .equals(tvgId)
      .filter(p => p.endTime >= startTime && p.startTime <= endTime)
      .sortBy('startTime');
  }

  public async clearEpg(playlistId: string): Promise<void> {
    await iptvDb.programs.where('playlistId').equals(playlistId).delete();
  }

  public async savePrograms(programs: IptvProgram[]): Promise<void> {
    await iptvDb.programs.bulkPut(programs);
  }
}
