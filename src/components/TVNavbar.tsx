import React from 'react';
import { Home, Film, Tv, Popcorn, Antenna, Heart, Search, Settings } from 'lucide-react';
import { TVSidebar, TVSidebarItem } from '../design-system';
import { useSpatialFocus } from './SpatialFocusContainer';

interface TVNavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  // Props unused in new design but kept to avoid breaking App.tsx currently
  selectedLanguage?: string;
  onLanguageSelect?: (lang: string) => void;
  isTizenNative?: boolean;
}

export const TVNavbar: React.FC<TVNavbarProps> = ({
  activeTab,
  onTabChange,
}) => {
  const { focusedId } = useSpatialFocus();
  
  // The sidebar is expanded if any element inside it is focused.
  const isExpanded = focusedId.startsWith('nav-');

  const navTabs = [
    { id: 'nav-search', label: 'Search', icon: <Search className="w-6 h-6" /> },
    { id: 'nav-home', label: 'Home', icon: <Home className="w-6 h-6" /> },
    { id: 'nav-movies', label: 'Movies', icon: <Film className="w-6 h-6" /> },
    { id: 'nav-series', label: 'Series', icon: <Tv className="w-6 h-6" /> },
    { id: 'nav-anime', label: 'Anime', icon: <Popcorn className="w-6 h-6" /> },
    { id: 'nav-livetv', label: 'Live TV', icon: <Antenna className="w-6 h-6" /> },
    { id: 'nav-watchlist', label: 'Library', icon: <Heart className="w-6 h-6" /> },
    { id: 'nav-settings', label: 'Settings', icon: <Settings className="w-6 h-6" /> },
  ];

  return (
    <TVSidebar id="sidebar" isExpanded={isExpanded}>
      <div className="flex-1 flex flex-col gap-4 mt-8">
        {navTabs.map((tab) => (
          <TVSidebarItem
            key={tab.id}
            id={tab.id}
            groupId="sidebar"
            icon={tab.icon}
            label={tab.label}
            isActive={activeTab === tab.id}
            isExpanded={isExpanded}
            onClick={() => onTabChange(tab.id)}
          />
        ))}
      </div>
    </TVSidebar>
  );
};
