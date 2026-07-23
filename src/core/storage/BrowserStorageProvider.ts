import { AsyncStorageProvider } from './types';

export class BrowserStorageProvider implements AsyncStorageProvider {
  public async get(key: string): Promise<string | null> {
    return localStorage.getItem(key);
  }

  public async set(key: string, value: string): Promise<void> {
    localStorage.setItem(key, value);
  }

  public async remove(key: string): Promise<void> {
    localStorage.removeItem(key);
  }

  public async clear(): Promise<void> {
    localStorage.clear();
  }

  public async exists(key: string): Promise<boolean> {
    return localStorage.getItem(key) !== null;
  }
}
