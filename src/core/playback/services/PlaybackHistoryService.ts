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
  private static readonly HISTORY_INDEX_KEY = '__media_index__';
  private static readonly MAX_HISTORY_ITEMS = 100;
  private cacheManager: CacheManager;
  private historyIndex: string[] | null = null;
  private historyIndexLoad: Promise<string[]> | null = null;
  private historyIndexQueue: Promise<void> = Promise.resolve();

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
      
      await Promise.all([
        this.cacheManager.set('history', mediaId, record, CachePolicyType.PLAYBACK_PROGRESS),
        this.indexMedia(mediaId),
      ]);
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
     await Promise.all([
       this.cacheManager.set('history', mediaId, record, CachePolicyType.PLAYBACK_PROGRESS),
       this.indexMedia(mediaId),
     ]);
  }

  public async getAllHistory(): Promise<PlaybackHistoryRecord[]> {
    await this.historyIndexQueue;
    const ids = await this.loadHistoryIndex();
    const records = await Promise.all(ids.map((id) => this.getProgress(id)));
    return records
      .filter((record): record is PlaybackHistoryRecord => record !== null)
      .sort((left, right) => right.lastWatched - left.lastWatched);
  }

  private async loadHistoryIndex(): Promise<string[]> {
    if (this.historyIndex) return this.historyIndex;
    if (!this.historyIndexLoad) {
      this.historyIndexLoad = this.cacheManager
        .get<string[]>('history', PlaybackHistoryService.HISTORY_INDEX_KEY, CachePolicyType.PLAYBACK_PROGRESS)
        .then((ids) => {
          this.historyIndex = Array.isArray(ids)
            ? [...new Set(ids.filter((id) => typeof id === 'string'))].slice(0, PlaybackHistoryService.MAX_HISTORY_ITEMS)
            : [];
          return this.historyIndex;
        })
        .finally(() => { this.historyIndexLoad = null; });
    }
    return this.historyIndexLoad;
  }

  private indexMedia(mediaId: string): Promise<void> {
    this.historyIndexQueue = this.historyIndexQueue.then(async () => {
      const ids = await this.loadHistoryIndex();
      if (ids[0] === mediaId) return;
      this.historyIndex = [mediaId, ...ids.filter((id) => id !== mediaId)]
        .slice(0, PlaybackHistoryService.MAX_HISTORY_ITEMS);
      await this.cacheManager.set(
        'history',
        PlaybackHistoryService.HISTORY_INDEX_KEY,
        this.historyIndex,
        CachePolicyType.PLAYBACK_PROGRESS,
      );
    });
    return this.historyIndexQueue;
  }
}
