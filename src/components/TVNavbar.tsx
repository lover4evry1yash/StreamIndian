/**
 * StreamIndian - Tizen TV Left Navigation Rail
 * Samsung Smart TV 10-foot navigation rail with collapsible sidebar, D-Pad focus expansion,
 * language filters, and live AVPlay status indicator.
 */

import React, { useState } from 'react';
import { FocusItem } from './FocusItem';
import { Tv, Search, Film, Bookmark, Settings, Activity, Globe, ChevronRight } from 'lucide-react';

interface TVNavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  selectedLanguage: string;
  onLanguageSelect: (lang: string) => void;
  isTizenNative: boolean;
}

export const TVNavbar: React.FC<TVNavbarProps> = ({
  activeTab,
  onTabChange,
  selectedLanguage,
  onLanguageSelect,
  isTizenNative,
}) => {
  const [showLanguageDrawer, setShowLanguageDrawer] = useState(false);

  const navTabs = [
    { id: 'nav-search', label: 'Search', icon: Search },
    { id: 'nav-home', label: 'Home', icon: Tv },
    { id: 'nav-watchlist', label: 'Watchlist & History', icon: Bookmark },
    { id: 'nav-audit', label: 'Tizen System Audit', icon: Activity },
    { id: 'nav-settings', label: 'Settings', icon: Settings },
  ];

  const languages = ['All', 'Hindi', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Bengali', 'Marathi', 'Punjabi'];

  return (
    <aside className="fixed top-0 left-0 bottom-0 z-40 bg-[#07070a]/95 backdrop-blur-2xl border-r border-white/10 w-20 hover:w-64 focus-within:w-64 group transition-all duration-300 flex flex-col justify-between py-6 px-3 shadow-2xl overflow-hidden select-none">
      {/* Brand & Tizen TV Status */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-600/40 flex-shrink-0">
            <Film className="w-6 h-6" />
          </div>
          <div className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            <h1 className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
              StreamIndian
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-600/40 text-indigo-300 font-mono font-semibold border border-indigo-500/30">
                Tizen TV
              </span>
            </h1>
            <p className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${isTizenNative ? 'bg-emerald-400 animate-pulse' : 'bg-indigo-400'}`}></span>
              {isTizenNative ? 'Samsung AVPlay Connected' : 'Tizen OS Simulator'}
            </p>
          </div>
        </div>

        {/* Vertical Navigation Tabs */}
        <nav className="space-y-2 pt-2">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <FocusItem
                key={tab.id}
                id={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`w-full h-12 px-3 rounded-2xl flex items-center gap-4 text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-[0_0_22px_rgba(79,70,229,0.5)] border border-indigo-400/60'
                    : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-indigo-400'}`} />
                <span className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                  {tab.label}
                </span>
              </FocusItem>
            );
          })}
        </nav>
      </div>

      {/* Language Filter & Quick Options */}
      <div className="space-y-3">
        {/* Language Quick Trigger */}
        <div className="relative">
          <FocusItem
            id="nav-lang-trigger"
            onClick={() => setShowLanguageDrawer(!showLanguageDrawer)}
            className="w-full h-11 px-3 rounded-2xl bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 flex items-center justify-between text-xs font-bold transition-all"
          >
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <span className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                Lang: <span className="text-indigo-300 font-extrabold">{selectedLanguage}</span>
              </span>
            </div>
            <ChevronRight className={`w-4 h-4 text-zinc-500 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all ${showLanguageDrawer ? 'rotate-90' : ''}`} />
          </FocusItem>

          {/* Collapsible Language Grid */}
          {showLanguageDrawer && (
            <div className="mt-2 p-2 bg-black/90 border border-white/10 rounded-2xl space-y-1 max-h-48 overflow-y-auto scrollbar-none">
              {languages.map((lang) => {
                const isSelected = selectedLanguage === lang;
                const tabId = `lang-${lang.toLowerCase()}`;
                return (
                  <FocusItem
                    key={tabId}
                    id={tabId}
                    onClick={() => {
                      onLanguageSelect(lang);
                      setShowLanguageDrawer(false);
                    }}
                    className={`w-full py-1.5 px-2 rounded-xl text-xs font-bold text-left transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-black'
                        : 'text-zinc-400 hover:text-white bg-white/5'
                    }`}
                  >
                    {lang}
                  </FocusItem>
                );
              })}
            </div>
          )}
        </div>

        {/* Samsung Tizen OS Badge */}
        <div className="px-1 text-[10px] text-zinc-500 font-mono opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 whitespace-nowrap">
          Tizen 6.0+ AVPlay Native
        </div>
      </div>
    </aside>
  );
};

