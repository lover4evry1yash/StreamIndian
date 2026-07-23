content = open('src/core/storage/SettingsManager.ts').read()

import re

new_app_settings = """export interface AppSettings {
  language: string[];
  theme: 'dark' | 'light' | 'system';
  developerMode: boolean;
  playback: {
    autoPlayNext: boolean;
    defaultSubtitleLanguage: string | null;
    defaultAudioLanguage: string | null;
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
}"""

content = re.sub(r"export interface AppSettings \{.*?\};?\n\}", new_app_settings, content, flags=re.DOTALL)

default_settings_replacement = """const DEFAULT_SETTINGS: AppSettings = {
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
  }
};"""

content = re.sub(r"const DEFAULT_SETTINGS: AppSettings = \{.*?\};?\n\}?;", default_settings_replacement, content, flags=re.DOTALL)

open('src/core/storage/SettingsManager.ts', 'w').write(content)
