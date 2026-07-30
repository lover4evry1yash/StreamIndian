import { StorageManager } from './StorageManager';
import { EventBus } from '../EventBus';

export interface AppSettings {
  language: string[];
  theme: 'dark' | 'light' | 'system';
  developerMode: boolean;
  playback: {
    autoPlayNext: boolean;
    defaultSubtitleLanguage: string | null;
    defaultAudioLanguage: string | null;
  };
  providers: {
    [providerId: string]: {
      enabled: boolean;
      apiKey?: string;
      username?: string;
      clientId?: string;
      clientSecret?: string;
      accessToken?: string;
    };
  };
  streams: {
    preferredDebrid: string;
    torboxApiKey: string;
    realDebridApiKey: string;
    premiumizeApiKey: string;
    sortMode: 'best' | 'quality' | 'fastest' | 'size_asc' | 'size_desc' | 'seeders' | 'language' | 'newest' | 'priority';
    hideUncached: boolean;
    stremioAddons: string[];
  };
}

const DEFAULT_SETTINGS: AppSettings = {
  language: ['Hindi', 'Tamil', 'Telugu', 'Malayalam'],
  theme: 'dark',
  developerMode: false,
  playback: {
    autoPlayNext: true,
    defaultSubtitleLanguage: 'English',
    defaultAudioLanguage: 'Hindi',
  },
  streams: {
    preferredDebrid: 'torbox',
    torboxApiKey: '',
    realDebridApiKey: '',
    premiumizeApiKey: '',
    sortMode: 'best',
    hideUncached: false,
    stremioAddons: ['https://torrentio.strem.fun/manifest.json']
  },
  providers: {}
};

const SETTINGS_KEY = 'streamindian_settings_v2';

export class SettingsManager {
  private storage: StorageManager;
  private eventBus: EventBus;
  private currentSettings: AppSettings;
  private isInitialized = false;
  
  constructor(storage: StorageManager, eventBus: EventBus) {
    this.storage = storage;
    this.eventBus = eventBus;
    this.currentSettings = { ...DEFAULT_SETTINGS };
  }

  public async initialize(): Promise<void> {
    const stored = await this.storage.get<AppSettings>(SETTINGS_KEY);
    if (stored) {
      this.currentSettings = { ...DEFAULT_SETTINGS, ...stored };
      
      // Backward compatibility migration for TorBox API key
      let needsSave = false;
      if (!this.currentSettings.streams.torboxApiKey && this.currentSettings.providers?.torbox?.apiKey) {
          this.currentSettings.streams.torboxApiKey = this.currentSettings.providers.torbox.apiKey;
          // Delete old one so it doesn't stay around
          delete this.currentSettings.providers.torbox.apiKey;
          needsSave = true;
      }
      
      if (needsSave) {
          await this.save(this.currentSettings);
      }
    } else {
      await this.save(this.currentSettings);
    }
    this.isInitialized = true;
    this.eventBus.emit('SETTINGS_LOADED', this.currentSettings);
  }

  public getSettings(): AppSettings {
    return this.currentSettings;
  }

  public async updateSettings(updates: Partial<AppSettings>): Promise<void> {
    this.currentSettings = { ...this.currentSettings, ...updates };
    await this.save(this.currentSettings);
    this.eventBus.emit('SETTINGS_UPDATED', this.currentSettings);
  }

  private async save(settings: AppSettings): Promise<void> {
    await this.storage.set(SETTINGS_KEY, settings);
  }
}
