import { CacheManager } from '../../storage/CacheManager';
import { CachePolicyType } from '../../storage/types';

export interface PlaybackHistoryRecord {
  mediaId: string;
  streamId: string | null;
  currentTime: number;
  duration: number;
  completionPercentage: number;
  lastWatched: number;
  completed: boolean;
}

export class PlaybackHistoryService {
  private static readonly PROGRESS_THRESHOLD = 0.95; // 95% is considered completed
  private cacheManager: CacheManager;

  constructor(cacheManager: CacheManager) {
    this.cacheManager = cacheManager;
  }

  public async saveProgress(
    mediaId: string, 
    streamId: string | null, 
    currentTime: number, 
    duration: number
  ): Promise<void> {
    if (duration > 0 && currentTime > 0) {
      const percentage = currentTime / duration;
      const completed = percentage >= PlaybackHistoryService.PROGRESS_THRESHOLD;
      
      const record: PlaybackHistoryRecord = {
        mediaId,
        streamId,
        currentTime: completed ? 0 : currentTime,
        duration,
        completionPercentage: percentage,
        lastWatched: Date.now(),
        completed,
      };
      
      await this.cacheManager.set('history', mediaId, record, CachePolicyType.PLAYBACK_PROGRESS);
    }
  }

  public async getProgress(mediaId: string): Promise<PlaybackHistoryRecord | null> {
    const record = await this.cacheManager.get<PlaybackHistoryRecord>('history', mediaId, CachePolicyType.PLAYBACK_PROGRESS);
    return record;
  }

  public async getResumePosition(mediaId: string): Promise<number> {
    const record = await this.getProgress(mediaId);
    if (record && !record.completed) {
      return record.currentTime;
    }
    return 0;
  }

  public async getBatchResumePositions(mediaIds: string[]): Promise<Record<string, number>> {
    const results: Record<string, number> = {};
    await Promise.all(
      mediaIds.map(async (id) => {
        const pos = await this.getResumePosition(id);
        if (pos > 0) {
          results[id] = pos;
        }
      })
    );
    return results;
  }

  public async markCompleted(mediaId: string): Promise<void> {
     const record: PlaybackHistoryRecord = {
        mediaId,
        streamId: null,
        currentTime: 0,
        duration: 0,
        completionPercentage: 1,
        lastWatched: Date.now(),
        completed: true,
     };
     await this.cacheManager.set('history', mediaId, record, CachePolicyType.PLAYBACK_PROGRESS);
  }

  public async getAllHistory(): Promise<PlaybackHistoryRecord[]> {
      // Future implementation for fetching all keys in 'history' namespace
      return [];
  }
}
