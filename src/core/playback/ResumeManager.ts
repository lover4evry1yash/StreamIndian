import { CacheManager, CachePolicyType } from '../storage';

export interface ResumeState {
  currentTime: number;
  duration: number;
  timestamp: number;
  completed: boolean;
}

export class ResumeManager {
  private static readonly PROGRESS_THRESHOLD = 0.95; // Consider completed if 95% watched
  private cacheManager: CacheManager;

  constructor(cacheManager: CacheManager) {
    this.cacheManager = cacheManager;
  }

  public async saveProgress(mediaId: string, currentTime: number, duration: number): Promise<void> {
    if (duration > 0 && currentTime > 0) {
      const percentage = currentTime / duration;
      const completed = percentage >= ResumeManager.PROGRESS_THRESHOLD;
      
      const state: ResumeState = {
        currentTime: completed ? 0 : currentTime,
        duration,
        timestamp: Date.now(),
        completed,
      };
      
      await this.cacheManager.set('resume', mediaId, state, CachePolicyType.PLAYBACK_PROGRESS);
    }
  }

  public async getResumePosition(mediaId: string): Promise<number> {
    const state = await this.cacheManager.get<ResumeState>('resume', mediaId, CachePolicyType.PLAYBACK_PROGRESS);
    if (state && !state.completed) {
      return state.currentTime;
    }
    return 0;
  }

  public async clearProgress(mediaId: string): Promise<void> {
     const state: ResumeState = {
        currentTime: 0,
        duration: 0,
        timestamp: Date.now(),
        completed: true,
     };
     await this.cacheManager.set('resume', mediaId, state, CachePolicyType.PLAYBACK_PROGRESS);
  }

  public async getBatchResumePositions(mediaIds: string[]): Promise<Record<string, number>> {
    const results: Record<string, number> = {};
    if (!mediaIds || mediaIds.length === 0) return results;
    
    const positions = await Promise.all(mediaIds.map(id => this.getResumePosition(id)));
    
    mediaIds.forEach((id, index) => {
      results[id] = positions[index];
    });
    
    return results;
  }
}
