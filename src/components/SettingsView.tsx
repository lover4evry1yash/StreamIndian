/**
 * StreamIndian - TV App Settings View
 */

import React, { useState, useRef, useEffect } from 'react';
import { FocusItem } from './FocusItem';
import { SettingsProvidersView } from './SettingsProvidersView';
import { Settings, Globe, Shield, Tv, Sparkles } from 'lucide-react';
import { useSettingsManager, useEventBus } from '../context/ServiceContext';
import { SettingsManager, AppSettings } from '../core/storage';

export const SettingsView: React.FC = () => {
  const settingsManager = useSettingsManager();
  const eventBus = useEventBus();
  const [settings, setSettings] = useState<AppSettings>(settingsManager.getSettings());
  
  // Example dummy local state for things not yet in AppSettings
  const [defaultQuality, setDefaultQuality] = useState('1080p FHD');

  const allLangs = ['Hindi', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Bengali', 'Marathi', 'Punjabi', 'Gujarati'];

  useEffect(() => {
    const handleSettingsUpdated = (newSettings: AppSettings) => setSettings(newSettings);
    eventBus.on('SETTINGS_UPDATED', handleSettingsUpdated);
    return () => eventBus.off('SETTINGS_UPDATED', handleSettingsUpdated);
  }, [eventBus]);

  const toggleLanguage = (lang: string) => {
    let updated: string[];
    if (settings.language.includes(lang)) {
      updated = settings.language.filter((l) => l !== lang);
    } else {
      updated = [...settings.language, lang];
    }
    settingsManager.updateSettings({ language: updated });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 text-zinc-100">
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white">StreamIndian TV Settings</h2>
          <p className="text-xs text-zinc-400">Configure language defaults, video quality, and Tizen AVPlay settings.</p>
        </div>
      </div>

      {/* Language Preferences */}
      <section className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
        <div className="flex items-center gap-2 font-bold text-sm text-indigo-400">
          <Globe className="w-4 h-4" /> Preferred Indian Languages
        </div>
        <p className="text-xs text-zinc-400">
          Selected languages will be prioritized in your TV home feed.
        </p>

        <div className="flex flex-wrap gap-2 pt-2">
          {allLangs.map((lang) => {
            const isSelected = settings.language.includes(lang);
            return (
              <FocusItem
                key={`pref-lang-${lang}`}
                id={`pref-lang-${lang}`}
                onClick={() => toggleLanguage(lang)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-black shadow-[0_0_12px_rgba(79,70,229,0.4)]'
                    : 'bg-black/40 text-zinc-400 border border-white/10 hover:text-white'
                }`}
              >
                {lang} {isSelected ? '✓' : '+'}
              </FocusItem>
            );
          })}
        </div>
      </section>

      {/* Default Playback Quality */}
      <section className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
        <div className="flex items-center gap-2 font-bold text-sm text-indigo-400">
          <Tv className="w-4 h-4" /> Default Samsung AVPlay Quality
        </div>
        <div className="flex items-center gap-3">
          {['4K HDR', '1080p FHD', '720p HD', 'Auto'].map((q) => (
            <FocusItem
              key={`q-${q}`}
              id={`q-${q}`}
              onClick={() => setDefaultQuality(q)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                defaultQuality === q
                  ? 'bg-indigo-600 text-white font-black shadow-[0_0_12px_rgba(79,70,229,0.4)]'
                  : 'bg-black/40 text-zinc-400 border border-white/10 hover:text-white'
              }`}
            >
              {q}
            </FocusItem>
          ))}
        </div>
      </section>

      {/* Provider Configurations */}
      <section className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
        <div className="flex items-center gap-2 font-bold text-sm text-indigo-400">
          <Sparkles className="w-4 h-4" /> Integrations & API Keys
        </div>
        <p className="text-xs text-zinc-400">
          Configure API keys for metadata providers, Debrid services, and content aggregators.
        </p>
        <SettingsProvidersView />
      </section>

      {/* Compliance & Security */}
      <section className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-3">
        <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
          <Shield className="w-4 h-4" /> Legal Source Guarantee
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          StreamIndian strictly index-serves legal public streams and personal media sources. Unauthorized streams or paid bypass routines are prohibited.
        </p>
      </section>
    </div>
  );
};
