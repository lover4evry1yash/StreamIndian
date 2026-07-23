/**
 * StreamIndian - Storage & User Profile State
 * Handles Local Watch History, Resume Progress, Watchlist, and Language Preferences.
 */

import { HistoryRecord } from '../../types/tizen';

const HISTORY_STORAGE_KEY = 'streamindian_history_v1';
const WATCHLIST_STORAGE_KEY = 'streamindian_watchlist_v1';
const PREFERRED_LANGUAGES_KEY = 'streamindian_languages_v1';

export class StreamIndianStorage {
  // Watch History & Progress Tracking
  public static getHistory(): HistoryRecord[] {
    try {
      const data = localStorage.getItem(HISTORY_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static saveProgress(record: HistoryRecord): void {
    try {
      const history = this.getHistory();
      const filtered = history.filter((item) => item.mediaId !== record.mediaId);
      filtered.unshift({
        ...record,
        lastWatchedTimestamp: Date.now(),
      });
      // Keep up to 30 history items to maintain low memory profile on Tizen TV
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(filtered.slice(0, 30)));
    } catch (e) {
      console.warn('Failed to save watch progress:', e);
    }
  }

  public static getProgressForMedia(mediaId: string): number {
    const history = this.getHistory();
    const found = history.find((item) => item.mediaId === mediaId);
    return found ? found.watchedDurationSeconds : 0;
  }

  // Watchlist
  public static getWatchlist(): string[] {
    try {
      const data = localStorage.getItem(WATCHLIST_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static toggleWatchlist(mediaId: string): boolean {
    const watchlist = this.getWatchlist();
    const index = watchlist.indexOf(mediaId);
    let updated: string[];
    let added = false;

    if (index >= 0) {
      updated = watchlist.filter((id) => id !== mediaId);
    } else {
      updated = [mediaId, ...watchlist];
      added = true;
    }

    try {
      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to update watchlist:', e);
    }

    return added;
  }

  public static isInWatchlist(mediaId: string): boolean {
    return this.getWatchlist().includes(mediaId);
  }

  // Language Preferences
  public static getPreferredLanguages(): string[] {
    try {
      const data = localStorage.getItem(PREFERRED_LANGUAGES_KEY);
      return data ? JSON.parse(data) : ['Hindi', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Bengali', 'Marathi'];
    } catch {
      return ['Hindi', 'Tamil', 'Telugu', 'Malayalam'];
    }
  }

  public static setPreferredLanguages(languages: string[]): void {
    try {
      localStorage.setItem(PREFERRED_LANGUAGES_KEY, JSON.stringify(languages));
    } catch (e) {
      console.warn('Failed to save preferred languages:', e);
    }
  }
}
