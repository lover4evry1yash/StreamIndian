import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useContainer } from '../context/ServiceContext';
import { IptvManager } from '../core/iptv/IptvManager';
import { IptvChannel, IptvPlaylist } from '../core/iptv/models';
import { FocusItem } from './FocusItem';
import { TVButton } from '../design-system';
import { Tv, List, Play, Heart, EyeOff, LayoutGrid } from 'lucide-react';
import { MediaItem } from '../types/tizen';
import { LazyImage } from './LazyImage';

interface IPTVViewProps {
  onSelectChannel: (channel: IptvChannel) => void;
}

export function IPTVView({ onSelectChannel }: IPTVViewProps) {
  const container = useContainer();
  const iptvManager = container.resolve<IptvManager>('IptvManager');
  
  const [playlists, setPlaylists] = useState<IptvPlaylist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<IptvPlaylist | null>(null);
  const [channelsByGroup, setChannelsByGroup] = useState<Record<string, IptvChannel[]>>({});
  const [groups, setGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    setLoading(true);
    try {
      const pl = await iptvManager.getPlaylists();
      setPlaylists(pl);
      if (pl.length > 0) {
        setSelectedPlaylist(pl[0]);
        await loadChannels(pl[0].id);
      }
    } catch (e) {
      console.error('Failed to load playlists', e);
    } finally {
      setLoading(false);
    }
  };

  const loadChannels = async (playlistId: string) => {
    try {
      // In a real app, you might want to paginate or use distinct queries to get groups
      // For simplicity here, we'll fetch all or just search an empty query to get first 500
      // Actually, since there's no getGroups, we can fetch all channels from the playlist (which might be large)
      // IptvDatabase doesn't have an easy getGroups, so we'll fetch channels and group them
      // Alternatively, we just display favorites or recent, but let's try searching first 500
      const allChannels = await iptvManager.searchChannels('', 500); // Temporary limit
      const filtered = allChannels.filter(c => c.playlistId === playlistId && !c.isHidden);
      
      const grouped: Record<string, IptvChannel[]> = {};
      filtered.forEach(c => {
        const g = c.group || 'Uncategorized';
        if (!grouped[g]) grouped[g] = [];
        grouped[g].push(c);
      });
      
      setChannelsByGroup(grouped);
      setGroups(Object.keys(grouped).sort());
    } catch (e) {
       console.error('Error loading channels', e);
    }
  };

  if (loading) {
    return <div className="p-12 flex items-center justify-center text-zinc-400">Loading IPTV...</div>;
  }

  if (playlists.length === 0) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-center space-y-6 mt-20">
        <Tv className="w-24 h-24 text-zinc-600" />
        <h2 className="text-3xl font-bold">No IPTV Playlists</h2>
        <p className="text-zinc-400 max-w-md text-lg">
          You haven't added any IPTV playlists yet. Go to Settings &gt; Providers to add your M3U or Xtream Codes.
        </p>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Playlist Selector (if multiple) */}
      {playlists.length > 1 && (
        <div className="px-12 pt-8 pb-4 flex gap-4 overflow-x-auto">
           {playlists.map((pl, i) => (
             <FocusItem
                key={pl.id}
                id={`iptv-pl-${pl.id}`}
                upId="nav-livetv"
                downId={`iptv-group-0-0`}
                leftId={i === 0 ? undefined : `iptv-pl-${playlists[i-1].id}`}
                rightId={i === playlists.length - 1 ? undefined : `iptv-pl-${playlists[i+1].id}`}
                onSelect={() => {
                   setSelectedPlaylist(pl);
                   loadChannels(pl.id);
                }}
             >
                {(focused) => (
                   <div className={`px-6 py-3 rounded-full text-lg transition-colors ${selectedPlaylist?.id === pl.id ? 'bg-indigo-600 text-white' : focused ? 'bg-white/20 text-white' : 'bg-white/10 text-zinc-400'}`}>
                      {pl.name}
                   </div>
                )}
             </FocusItem>
           ))}
        </div>
      )}

      {/* Channel Groups */}
      <div className="space-y-10 mt-8">
         {groups.map((group, groupIdx) => (
            <div key={group} className="px-12">
               <h3 className="text-xl font-semibold mb-4 text-zinc-100">{group}</h3>
               <div className="flex gap-4 overflow-x-auto pb-4">
                  {channelsByGroup[group].map((channel, idx) => (
                     <FocusItem
                        key={channel.id}
                        id={`iptv-group-${groupIdx}-${idx}`}
                        upId={groupIdx === 0 ? (playlists.length > 1 ? `iptv-pl-${selectedPlaylist?.id}` : 'nav-livetv') : `iptv-group-${groupIdx-1}-0`}
                        downId={groupIdx === groups.length - 1 ? undefined : `iptv-group-${groupIdx+1}-0`}
                        leftId={idx === 0 ? undefined : `iptv-group-${groupIdx}-${idx-1}`}
                        rightId={idx === channelsByGroup[group].length - 1 ? undefined : `iptv-group-${groupIdx}-${idx+1}`}
                        onSelect={() => onSelectChannel(channel)}
                     >
                        {(focused) => (
                           <div className={`w-48 h-32 rounded-xl bg-zinc-900 border-2 flex flex-col items-center justify-center p-4 text-center transition-transform ${focused ? 'border-white scale-105 z-10 shadow-xl' : 'border-transparent scale-100 opacity-70'}`}>
                              {channel.logo ? (
                                 <LazyImage src={channel.logo} alt={channel.name} className="w-16 h-16 object-contain mb-2" />
                              ) : (
                                 <Tv className="w-12 h-12 text-zinc-600 mb-2" />
                              )}
                              <span className="text-sm font-medium line-clamp-2">{channel.name}</span>
                           </div>
                        )}
                     </FocusItem>
                  ))}
               </div>
            </div>
         ))}
      </div>
    </div>
  );
}
