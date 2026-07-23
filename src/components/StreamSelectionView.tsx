import React, { useState, useEffect, useRef } from 'react';
import { MediaItem, StreamSource, PlaybackReadiness } from '../types/tizen';
import { FocusItem } from './FocusItem';
import { useSourceManager, useResolutionManager, useDebridManager, useTransferManager, useSettingsManager } from '../context/ServiceContext';
import { SettingsManager } from '../core/storage';
import { SourceManager, ResolutionManager, CanonicalStreamSource, DebridManager, TransferManager } from '../core/streams';
import { ArrowLeft, Play, Server, Clock, HardDrive, Cpu, Activity, DownloadCloud } from 'lucide-react';

interface StreamSelectionViewProps {
  media: MediaItem;
  onStreamSelected: (stream: StreamSource) => void;
  onClose: () => void;
}

export const StreamSelectionView: React.FC<StreamSelectionViewProps> = ({
  media,
  onStreamSelected,
  onClose
}) => {
  const [sources, setSources] = useState<CanonicalStreamSource[]>([]);
  const [streams, setStreams] = useState<StreamSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const sourceManager = useSourceManager();
  const resolutionManager = useResolutionManager();
  const debridManager = useDebridManager();
  const transferManager = useTransferManager();

  const [resolvingDebrid, setResolvingDebrid] = useState<{ progress: number; message: string } | null>(null);

  const handleStreamSelected = async (stream: StreamSource) => {
    const isDirectHttp = stream.url && (stream.url.startsWith('http://') || stream.url.startsWith('https://') || stream.url.startsWith('blob:'));
    const needsDebrid = stream.readiness === PlaybackReadiness.DEBRID_REQUIRED || 
                        stream.readiness === PlaybackReadiness.DIRECT_TORRENT || 
                        !isDirectHttp;

    if (needsDebrid) {
        const infoHash = (stream as any).streamSource?.infoHash || 
                         (stream.url && stream.url.includes('btih:') ? stream.url.split('btih:')[1]?.split('&')[0] : 'stremiohash12345');
        const magnet = (stream as any).streamSource?.magnet || (stream.url?.startsWith('magnet:') ? stream.url : undefined);
        
        setResolvingDebrid({ progress: 10, message: 'Initiating Debrid Transfer...' });
        
        await transferManager.initiateTransfer(infoHash, magnet, stream.providerName);
        setResolvingDebrid({ progress: 50, message: 'Resolving Debrid Stream...' });
        
        const resolved = await debridManager.resolve(infoHash);
        
        setResolvingDebrid({ progress: 100, message: 'Stream ready!' });
        await new Promise(r => setTimeout(r, 300));
        
        const finalUrl = resolved?.url || '';
        
        if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
          setResolvingDebrid(null);
          setError('Failed to resolve playable direct HTTP stream.');
          return;
        }

        const resolvedStream: StreamSource = {
          ...stream,
          url: finalUrl,
          readiness: PlaybackReadiness.DEBRID_CACHED as PlaybackReadiness
        };
        setResolvingDebrid(null);
        onStreamSelected(resolvedStream);
    } else {
        onStreamSelected(stream);
    }
  };

  const settingsManager = useSettingsManager();
  const settings = settingsManager.getSettings();

  useEffect(() => {
    let isMounted = true;
    
    const fetchStreams = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 1. Discovery
        const discovered = await sourceManager.search({
          mediaId: media.id,
          type: 'movie',
          title: media.title,
          year: media.year
        });
        
        if (!isMounted) return;
        setSources(discovered);
        setResolving(true);
        setLoading(false);

        // 2. Resolution
        const resolved = await resolutionManager.resolve(discovered, { 
          mode: settings.streams?.sortMode || 'best', 
          preferredLanguage: settings.playback?.defaultAudioLanguage || undefined 
        });
        
        if (!isMounted) return;
        setStreams(resolved);
        setResolving(false);
      } catch (err) {
        if (isMounted) {
          setError('Failed to discover streams.');
          setLoading(false);
          setResolving(false);
        }
      }
    };

    fetchStreams();
    return () => { isMounted = false; };
  }, [media, sourceManager, resolutionManager]);


  let displayStreams = streams;
  if (settings.streams?.hideUncached) {
      displayStreams = streams.filter(s => s.readiness !== PlaybackReadiness.DEBRID_REQUIRED && s.readiness !== PlaybackReadiness.DIRECT_TORRENT);
  }

  const directStreams = displayStreams.filter(s => s.readiness === PlaybackReadiness.DIRECT || !s.readiness);
  const torrentStreams = displayStreams.filter(s => s.readiness === PlaybackReadiness.DEBRID_CACHED || s.readiness === PlaybackReadiness.DEBRID_REQUIRED || s.readiness === PlaybackReadiness.DIRECT_TORRENT);

  const renderBadge = (label: string, icon?: React.ReactNode, active: boolean = false) => (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${active ? 'bg-indigo-600 text-white' : 'bg-white/10 text-zinc-300'}`}>
      {icon} {label}
    </span>
  );

  const renderStreamItem = (s: StreamSource, index: number, prefix: string) => {
    const isDebrid = s.readiness === PlaybackReadiness.DEBRID_CACHED;
    const cacheStatus = s.cacheStatus ? Object.keys(s.cacheStatus).filter(k => s.cacheStatus![k]).join(', ') : null;
    
    return (
      <FocusItem
        key={s.id || `${prefix}-${index}`}
        id={`stream-${prefix}-${index}`}
        groupId="stream-selection"
        onClick={() => handleStreamSelected(s)}
        className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 focus:bg-indigo-600 focus:border-white transition-all text-left group"
      >
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className={`w-3 h-3 rounded-full ${isDebrid ? 'bg-purple-500 shadow-[0_0_10px_#a855f7]' : 'bg-green-500 shadow-[0_0_10px_#22c55e]'}`} />
            <h4 className="text-lg font-bold text-white group-focus:text-white flex items-center gap-2">
              {s.quality}
              {s.hdr && <span className="px-1.5 py-0.5 text-[10px] bg-yellow-500/20 text-yellow-400 rounded uppercase tracking-wider">HDR</span>}
              {s.dolbyVision && <span className="px-1.5 py-0.5 text-[10px] bg-purple-500/20 text-purple-400 rounded uppercase tracking-wider">DV</span>}
            </h4>
            <span className="text-sm font-mono text-zinc-400 group-focus:text-zinc-200">{s.format}</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 mt-2">
             {isDebrid && cacheStatus && renderBadge(`Cached on ${cacheStatus}`, <DownloadCloud className="w-3 h-3" />, true)}
             {s.codec && renderBadge(s.codec, <Cpu className="w-3 h-3" />)}
             {s.atmos && renderBadge('Atmos', <Activity className="w-3 h-3" />)}
             {s.size && renderBadge(`${(s.size / (1024*1024*1024)).toFixed(2)} GB`, <HardDrive className="w-3 h-3" />)}
             {s.seeders !== undefined && renderBadge(`${s.seeders} Seeders`, <Server className="w-3 h-3" />)}
             {renderBadge(s.providerName)}
          </div>
        </div>
        <Play className="w-6 h-6 text-zinc-400 group-focus:text-white opacity-0 group-focus:opacity-100 transition-opacity" />
      </FocusItem>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#050506] flex flex-col font-sans">
      <div className="p-8 md:p-12 pb-4 flex items-center justify-between border-b border-white/10 bg-black/50">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
             <FocusItem id="stream-sel-back" groupId="stream-selection" onClick={onClose} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 focus:bg-indigo-600 focus:outline-none">
               <ArrowLeft className="w-5 h-5" />
             </FocusItem>
             Stream Selection
          </h2>
          <p className="text-zinc-400 mt-1">{media.title} ({media.year})</p>
        </div>
      </div>


      {resolvingDebrid && (
        <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-8">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6" />
            <h3 className="text-2xl font-black text-white mb-2">{resolvingDebrid.message}</h3>
            <div className="w-64 h-2 bg-white/10 rounded-full overflow-hidden mt-4">
               <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${resolvingDebrid.progress}%` }} />
            </div>
            <p className="text-zinc-400 font-mono mt-2">{resolvingDebrid.progress}%</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
        {loading && (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
             <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
             <p className="text-indigo-400 font-bold tracking-widest uppercase">Discovering Sources...</p>
          </div>
        )}

        {resolving && (
          <div className="flex flex-col items-center justify-center h-32 gap-4">
             <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
             <p className="text-purple-400 font-bold tracking-widest uppercase text-sm">Resolving Streams ({sources.length} found)...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-xl text-center">
             <p className="text-red-400 font-bold">{error}</p>
          </div>
        )}

        {!loading && !resolving && streams.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center h-64 gap-4 opacity-50">
             <Server className="w-16 h-16" />
             <p className="text-xl font-bold">No streams found</p>
          </div>
        )}

        {!loading && (
          <div className="space-y-12 pb-20">
             {directStreams.length > 0 && (
               <section>
                 <h3 className="text-xs font-black tracking-widest text-zinc-500 uppercase mb-4 pl-1">Direct Streams</h3>
                 <div className="space-y-3">
                   {directStreams.map((s, i) => renderStreamItem(s, i, 'direct'))}
                 </div>
               </section>
             )}
             
             {torrentStreams.length > 0 && (
               <section>
                 <h3 className="text-xs font-black tracking-widest text-zinc-500 uppercase mb-4 pl-1">Torrent & Debrid Streams</h3>
                 <div className="space-y-3">
                   {torrentStreams.map((s, i) => renderStreamItem(s, i, 'torrent'))}
                 </div>
               </section>
             )}
          </div>
        )}
      </div>
    </div>
  );
};
