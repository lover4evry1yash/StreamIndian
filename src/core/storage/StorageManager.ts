import { AsyncStorageProvider } from './types';

export class StorageManager {
  private provider: AsyncStorageProvider;

  constructor(provider: AsyncStorageProvider) {
    this.provider = provider;
  }

  public async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.provider.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (e) {
      console.warn(`[StorageManager] Failed to get/parse key ${key}:`, e);
      return null;
    }
  }

  public async set<T>(key: string, value: T): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await this.provider.set(key, serialized);
    } catch (e) {
      console.warn(`[StorageManager] Failed to set key ${key}:`, e);
    }
  }

  public async remove(key: string): Promise<void> {
    try {
      await this.provider.remove(key);
    } catch (e) {
       console.warn(`[StorageManager] Failed to remove key ${key}:`, e);
    }
  }

  public async clear(): Promise<void> {
     try {
       await this.provider.clear();
     } catch (e) {
        console.warn(`[StorageManager] Failed to clear storage:`, e);
     }
  }

  public async exists(key: string): Promise<boolean> {
    try {
       return await this.provider.exists(key);
    } catch (e) {
       return false;
    }
  }
}
