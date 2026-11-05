import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useContainer } from '../context/ServiceContext';
import { IptvManager } from '../core/iptv/IptvManager';
import { IptvChannel, IptvPlaylist, IptvProgram } from '../core/iptv/models';
import { FocusItem } from './FocusItem';
import { AlertCircle, Heart, Plus, RefreshCw, Trash2, Tv } from 'lucide-react';
import { LazyImage } from './LazyImage';

interface IPTVViewProps {
  onSelectChannel: (channel: IptvChannel) => void;
}

interface PlaylistDraft {
  name: string;
  type: 'm3u' | 'xtream';
  url: string;
  epgUrl: string;
  username: string;
  password: string;
}

const PAGE_SIZE = 50;

export function IPTVView({ onSelectChannel }: IPTVViewProps) {
  const iptvManager = useContainer().resolve<IptvManager>('IptvManager');
  const [playlists, setPlaylists] = useState<IptvPlaylist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<IptvPlaylist | null>(null);
  const [channelsByGroup, setChannelsByGroup] = useState<Record<string, IptvChannel[]>>({});
  const [nowPlaying, setNowPlaying] = useState<Record<string, IptvProgram>>({});
  const [groups, setGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<IptvChannel[]>([]);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<PlaylistDraft>({
    name: '', type: 'm3u', url: '', epgUrl: '', username: '', password: '',
  });
  const loadGeneration = useRef(0);

  const loadChannels = useCallback(async (playlistId: string) => {
    const generation = ++loadGeneration.current;
    setLoading(true);
    try {
      const nextGroups = await iptvManager.getChannelGroups(playlistId);
      const entries = await Promise.all(nextGroups.map(async (group) => [
        group,
        (await iptvManager.getChannelsByGroup(playlistId, group, PAGE_SIZE)).filter((channel) => !channel.isHidden),
      ] as const));
      if (generation !== loadGeneration.current) return;
      const channels = entries.flatMap(([, groupChannels]) => groupChannels).filter((channel) => !!channel.tvgId);
      const programs: Record<string, IptvProgram> = {};
      for (let index = 0; index < channels.length; index += 10) {
        await Promise.all(channels.slice(index, index + 10).map(async (channel) => {
          try {
            const program = await iptvManager.epgManager.getNowPlaying(channel.tvgId!, playlistId);
            if (program) programs[channel.id] = program;
          } catch {
            // EPG is optional; a guide failure must not hide the channel list.
          }
        }));
      }
      if (generation !== loadGeneration.current) return;
      setGroups(nextGroups);
      setChannelsByGroup(Object.fromEntries(entries));
      setNowPlaying(programs);
    } catch (loadError) {
      if (generation === loadGeneration.current) setError(messageOf(loadError, 'Failed to load IPTV channels'));
    } finally {
      if (generation === loadGeneration.current) setLoading(false);
    }
  }, [iptvManager]);

  const loadPlaylists = useCallback(async (preferredId?: string) => {
    setLoading(true);
    setError('');
    try {
      const nextPlaylists = await iptvManager.getPlaylists();
      setPlaylists(nextPlaylists);
      const nextSelection = nextPlaylists.find((playlist) => playlist.id === preferredId)
        ?? nextPlaylists[0]
        ?? null;
      setSelectedPlaylist(nextSelection);
      if (nextSelection) await loadChannels(nextSelection.id);
      else {
        loadGeneration.current += 1;
        setChannelsByGroup({});
        setGroups([]);
        setLoading(false);
      }
    } catch (loadError) {
      setError(messageOf(loadError, 'Failed to load playlists'));
      setLoading(false);
    }
  }, [iptvManager, loadChannels]);

  useEffect(() => { void loadPlaylists(); }, [loadPlaylists]);

  useEffect(() => {
    if (!selectedPlaylist || !search.trim()) {
      setSearchResults([]);
      return;
    }
    let current = true;
    const timer = setTimeout(() => {
      void iptvManager.searchChannels(search.trim(), 100, selectedPlaylist.id)
        .then((results) => { if (current) setSearchResults(results); })
        .catch((searchError) => { if (current) setError(messageOf(searchError, 'Channel search failed')); });
    }, 200);
    return () => { current = false; clearTimeout(timer); };
  }, [iptvManager, search, selectedPlaylist?.id]);

  const handleAddPlaylist = async () => {
    const name = draft.name.trim();
    const url = draft.url.trim().replace(/\/$/, '');
    if (!name || !url) {
      setError('Enter a playlist name and URL.');
      return;
    }
    if (draft.type === 'm3u' && !/^https?:\/\//i.test(url)) {
      setError('M3U playlists must use an HTTP or HTTPS URL.');
      return;
    }
    if (draft.type === 'xtream' && (!draft.username.trim() || !draft.password)) {
      setError('Xtream playlists require a username and password.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const playlist = await iptvManager.addPlaylist({
        name,
        type: draft.type,
        url,
        epgUrl: draft.epgUrl.trim() || undefined,
        username: draft.type === 'xtream' ? draft.username.trim() : undefined,
        password: draft.type === 'xtream' ? draft.password : undefined,
        autoUpdate: false,
      });
      setShowAddForm(false);
      setDraft({ name: '', type: 'm3u', url: '', epgUrl: '', username: '', password: '' });
      await iptvManager.refreshPlaylist(playlist.id);
      await loadPlaylists(playlist.id);
    } catch (addError) {
      setError(messageOf(addError, 'Playlist saved, but refresh failed. Check the URL, credentials, and provider CORS support.'));
      await loadPlaylists();
    } finally {
      setBusy(false);
    }
  };

  const refreshSelected = async () => {
    if (!selectedPlaylist) return;
    setBusy(true);
    setError('');
    try {
      await iptvManager.refreshPlaylist(selectedPlaylist.id);
      await loadPlaylists(selectedPlaylist.id);
    } catch (refreshError) {
      setError(messageOf(refreshError, 'Playlist refresh failed.'));
    } finally {
      setBusy(false);
    }
  };

  const deleteSelected = async () => {
    if (!selectedPlaylist) return;
    try {
      await iptvManager.deletePlaylist(selectedPlaylist.id);
      await loadPlaylists();
    } catch (deleteError) {
      setError(messageOf(deleteError, 'Failed to remove playlist.'));
    }
  };

  const loadMore = async (group: string) => {
    if (!selectedPlaylist) return;
    const current = channelsByGroup[group] ?? [];
    try {
      const nextPage = await iptvManager.getChannelsByGroup(selectedPlaylist.id, group, PAGE_SIZE, current.length);
      const visible = nextPage.filter((channel) => !channel.isHidden);
      setChannelsByGroup((previous) => ({ ...previous, [group]: [...(previous[group] ?? []), ...visible] }));
    } catch (pageError) {
      setError(messageOf(pageError, `Failed to load more channels in ${group}.`));
    }
  };

  const toggleFavorite = async (channel: IptvChannel) => {
    try {
      await iptvManager.userDataManager.toggleFavorite(channel.id, !channel.isFavorite);
      setChannelsByGroup((previous) => ({
        ...previous,
        [channel.group]: (previous[channel.group] ?? []).map((entry) => entry.id === channel.id
          ? { ...entry, isFavorite: !entry.isFavorite }
          : entry),
      }));
      setSearchResults((previous) => previous.map((entry) => entry.id === channel.id
        ? { ...entry, isFavorite: !entry.isFavorite }
        : entry));
    } catch (favoriteError) {
      setError(messageOf(favoriteError, 'Failed to update favorite.'));
    }
  };

  const renderChannel = (channel: IptvChannel) => (
    <div key={channel.id} className="relative w-48">
      <FocusItem
        id={`iptv-channel-${channel.id}`}
        onClick={() => {
          void iptvManager.userDataManager.addRecentlyWatched(channel);
          onSelectChannel(channel);
        }}
        className="w-48 h-36 rounded-xl bg-zinc-900 border-2 border-transparent flex flex-col items-center justify-center p-4 text-center hover:border-white focus:border-white"
      >
        {channel.logoUrl
          ? <LazyImage src={channel.logoUrl} alt={channel.name} className="w-16 h-16 object-contain mb-2" />
          : <Tv className="w-12 h-12 text-zinc-600 mb-2" />}
        <span className="text-sm font-medium line-clamp-2">{channel.name}</span>
        {nowPlaying[channel.id] && <span className="mt-1 text-xs text-zinc-400 line-clamp-1">{nowPlaying[channel.id].title}</span>}
      </FocusItem>
      <FocusItem
        id={`iptv-favorite-${channel.id}`}
        onClick={() => { void toggleFavorite(channel); }}
        className="absolute right-2 top-2 rounded-full bg-black/80 p-2"
      >
        <Heart className={`h-5 w-5 ${channel.isFavorite ? 'fill-rose-500 text-rose-500' : 'text-white'}`} />
      </FocusItem>
    </div>
  );

  if (loading && playlists.length === 0) {
    return <div className="p-12 flex items-center justify-center text-zinc-400">Loading IPTV...</div>;
  }

  return (
    <div className="space-y-6 px-12 pb-20 pt-8">
      <div className="flex items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold">Live TV</h2>
          <p className="mt-1 text-zinc-400">Playlists and channel data stay on this device.</p>
        </div>
        <div className="flex gap-3">
          <FocusItem id="iptv-add-playlist" onClick={() => setShowAddForm((visible) => !visible)} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-bold">
            <Plus className="h-5 w-5" /> Add playlist
          </FocusItem>
          {selectedPlaylist && <>
            <FocusItem id="iptv-refresh-playlist" onClick={() => { void refreshSelected(); }} className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 font-bold">
              <RefreshCw className="h-5 w-5" /> Refresh
            </FocusItem>
            <FocusItem id="iptv-delete-playlist" onClick={() => { void deleteSelected(); }} className="flex items-center gap-2 rounded-xl bg-rose-900/70 px-4 py-3 font-bold">
              <Trash2 className="h-5 w-5" /> Remove
            </FocusItem>
          </>}
        </div>
      </div>

      {error && <div role="alert" className="flex items-center gap-3 rounded-xl border border-rose-500/40 bg-rose-950/50 p-4 text-rose-200"><AlertCircle className="h-5 w-5 shrink-0" />{error}</div>}

      {showAddForm && <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h3 className="mb-4 text-xl font-bold">Add an IPTV playlist</h3>
        <div className="grid grid-cols-2 gap-4">
          <label className="space-y-2 text-sm text-zinc-300">Playlist name
            <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="w-full rounded-lg border border-white/10 bg-black/50 p-3 text-white" placeholder="My playlist" />
          </label>
          <label className="space-y-2 text-sm text-zinc-300">Playlist type
            <select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value as PlaylistDraft['type'] })} className="w-full rounded-lg border border-white/10 bg-zinc-900 p-3 text-white">
              <option value="m3u">M3U URL</option>
              <option value="xtream">Xtream Codes</option>
            </select>
          </label>
          <label className="col-span-2 space-y-2 text-sm text-zinc-300">{draft.type === 'm3u' ? 'M3U URL' : 'Xtream server URL'}
            <input value={draft.url} onChange={(event) => setDraft({ ...draft, url: event.target.value })} className="w-full rounded-lg border border-white/10 bg-black/50 p-3 text-white" placeholder="https://provider.example.test/playlist.m3u" />
          </label>
          {draft.type === 'm3u' ? <label className="col-span-2 space-y-2 text-sm text-zinc-300">XMLTV EPG URL (optional)
            <input value={draft.epgUrl} onChange={(event) => setDraft({ ...draft, epgUrl: event.target.value })} className="w-full rounded-lg border border-white/10 bg-black/50 p-3 text-white" placeholder="https://provider.example.test/guide.xml" />
          </label> : <>
            <label className="space-y-2 text-sm text-zinc-300">Username
              <input value={draft.username} onChange={(event) => setDraft({ ...draft, username: event.target.value })} className="w-full rounded-lg border border-white/10 bg-black/50 p-3 text-white" autoComplete="off" />
            </label>
            <label className="space-y-2 text-sm text-zinc-300">Password
              <input type="password" value={draft.password} onChange={(event) => setDraft({ ...draft, password: event.target.value })} className="w-full rounded-lg border border-white/10 bg-black/50 p-3 text-white" autoComplete="new-password" />
            </label>
          </>}
        </div>
        <div className="mt-5 flex gap-3">
          <FocusItem id="iptv-save-playlist" onClick={() => { void handleAddPlaylist(); }} className="rounded-xl bg-indigo-600 px-5 py-3 font-bold">{busy ? 'Saving…' : 'Save and load'}</FocusItem>
          <FocusItem id="iptv-cancel-playlist" onClick={() => setShowAddForm(false)} className="rounded-xl bg-white/10 px-5 py-3 font-bold">Cancel</FocusItem>
        </div>
      </section>}

      {playlists.length > 0 && <div className="flex flex-wrap items-center gap-3">
        {playlists.map((playlist) => <FocusItem
          key={playlist.id}
          id={`iptv-playlist-${playlist.id}`}
          onClick={() => { setSelectedPlaylist(playlist); void loadChannels(playlist.id); }}
          className={`rounded-full px-5 py-3 font-semibold ${selectedPlaylist?.id === playlist.id ? 'bg-indigo-600 text-white' : 'bg-white/10 text-zinc-300'}`}
        >{playlist.name}</FocusItem>)}
      </div>}

      {selectedPlaylist && <>
        <div className="flex max-w-2xl items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent text-lg text-white outline-none" placeholder="Search channels" aria-label="Search channels" />
        </div>
        {search.trim() ? <section>
          <h3 className="mb-4 text-xl font-semibold">Search results</h3>
          {searchResults.length ? <div className="flex flex-wrap gap-4">{searchResults.map(renderChannel)}</div> : <p className="text-zinc-400">No matching channels.</p>}
        </section> : loading ? <p className="text-zinc-400">Loading channels…</p> : groups.length === 0 ? <p className="text-zinc-400">This playlist has no channels. Refresh it or check the URL.</p> : <div className="space-y-10">
          {groups.map((group) => {
            const channels = channelsByGroup[group] ?? [];
            return <section key={group}>
              <h3 className="mb-4 text-xl font-semibold">{group}</h3>
              <div className="flex flex-wrap gap-4">{channels.map(renderChannel)}</div>
              {channels.length >= PAGE_SIZE && <FocusItem id={`iptv-more-${group}`} onClick={() => { void loadMore(group); }} className="mt-4 inline-block rounded-xl bg-white/10 px-4 py-3 font-bold">Load more</FocusItem>}
            </section>;
          })}
        </div>}
      </>}

      {!playlists.length && !showAddForm && <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-zinc-300">
        <Tv className="mx-auto mb-4 h-16 w-16 text-zinc-500" />
        <h3 className="text-2xl font-bold">No IPTV playlists yet</h3>
        <p className="mt-2">Add an M3U playlist or Xtream account to load your channels.</p>
      </div>}
    </div>
  );
}

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
