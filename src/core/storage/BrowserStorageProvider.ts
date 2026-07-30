import { AsyncStorageProvider } from './types';
import Dexie, { Table } from 'dexie';

interface KeyVal {
  key: string;
  value: string;
}

class AppDatabase extends Dexie {
  public keyval!: Table<KeyVal, string>;

  constructor() {
    super('StreamIndianCache');
    this.version(1).stores({
      keyval: 'key' // Primary key
    });
  }
}

const db = new AppDatabase();

export class BrowserStorageProvider implements AsyncStorageProvider {
  public async get(key: string): Promise<string | null> {
    try {
      const record = await db.keyval.get(key);
      return record ? record.value : null;
    } catch (e) {
      console.warn('IDB get failed, falling back to localStorage', e);
      return localStorage.getItem(key);
    }
  }

  public async set(key: string, value: string): Promise<void> {
    try {
      await db.keyval.put({ key, value });
    } catch (e) {
      console.warn('IDB set failed, falling back to localStorage', e);
      try {
        localStorage.setItem(key, value);
      } catch (err) {
        console.error('LocalStorage quota exceeded!', err);
      }
    }
  }

  public async remove(key: string): Promise<void> {
    try {
      await db.keyval.delete(key);
    } catch (e) {
      localStorage.removeItem(key);
    }
  }

  public async clear(): Promise<void> {
    try {
      await db.keyval.clear();
    } catch (e) {
      localStorage.clear();
    }
  }

  public async exists(key: string): Promise<boolean> {
    const val = await this.get(key);
    return val !== null;
  }
}
