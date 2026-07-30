import React, { useEffect, useState } from 'react';
import { MediaItem, StreamSource, PlaybackReadiness } from '../types/tizen';
import { MediaSearchQuery } from '../core/streams/types';
import { FocusItem } from './FocusItem';
import { Play, Server, HardDrive, Cpu, Activity, DownloadCloud, AlertCircle } from 'lucide-react';
import { TVBadge, TVLoading, TVButton, TVEmptyState, TVErrorState, TVCard } from '../design-system';
import { useStreamViewModel } from '../context/ServiceContext';
import { useSpatialFocus } from './SpatialFocusContainer';

interface StreamSectionProps {
  query: MediaSearchQuery;
  onStreamSelected: (stream: StreamSource) => void;
  groupId: string;
  pendingFocus?: boolean;
  onFocusComplete?: () => void;
}

export const StreamSection: React.FC<StreamSectionProps> = ({
  query,
  onStreamSelected,
  groupId,
  pendingFocus,
  onFocusComplete
}) => {
  const streamViewModel = useStreamViewModel();
  const { setFocusedId } = useSpatialFocus();
  const [state, setState] = useState(streamViewModel.state);
  const [streams, setStreams] = useState(streamViewModel.streams);
  const [discoveredSources, setDiscoveredSources] = useState(streamViewModel.discoveredSources);
  const [error, setError] = useState(streamViewModel.error);
  const [debridMessage, setDebridMessage] = useState(streamViewModel.debridMessage);

  useEffect(() => {
    const handleStateChange = (payload: any) => {
      setState(payload.state);
      setStreams(payload.streams);
      console.log('[UI:StreamSection] received canonical sources:', payload.discoveredSources.length, 'resolved streams:', payload.streams.length);
      setDiscoveredSources(payload.discoveredSources);
      setError(payload.error);
      setDebridMessage(payload.debridMessage);
    };

    streamViewModel.fetchStreams(query);
    const bus = (streamViewModel as any).eventBus;
    if (bus) {
        bus.on('stream:state_changed', handleStateChange);
    }

    return () => {
        if (bus) {
            bus.off('stream:state_changed', handleStateChange);
        }
    };
  }, [query]);

  useEffect(() => {
    if (pendingFocus && state === 'ready' && streams.length > 0) {
      setFocusedId('stream-0');
      if (onFocusComplete) onFocusComplete();
    }
  }, [pendingFocus, state, streams, setFocusedId, onFocusComplete]);

  const handleStreamSelected = async (stream: StreamSource) => {
     const resolved = await streamViewModel.selectStream(stream);
     if (resolved) {
         onStreamSelected(resolved);
     }
  };

  if (state === 'discovering' || state === 'resolving') {
    return (
      <div className="flex flex-col items-center justify-center h-64 w-full">
         <TVLoading text={state === 'discovering' ? "Searching Providers..." : `Resolving Streams (${discoveredSources.length} found)...`} />
      </div>
    );
  }

  if (state === 'error' && error) {
    return (
      <div className="flex items-center justify-center h-64 w-full">
         <TVErrorState 
             title="Stream Discovery Failed"
             description={error}
             actionLabel="Retry Search"
             onAction={() => streamViewModel.fetchStreams(query)}
         />
      </div>
    );
  }

  if (streams.length === 0 && state === 'ready') {
    return (
      <div className="flex items-center justify-center h-64 w-full">
         <TVEmptyState 
            icon={<AlertCircle className="w-12 h-12 text-tv-text-secondary opacity-50" />}
            title="No Streams Found"
            description="We couldn't find any playable streams for this media."
            actionLabel="Search Again"
            onAction={() => streamViewModel.fetchStreams(query)}
         />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {state === 'debrid_transfer' && (
        <div className="p-8 bg-tv-surface-light rounded-tv-card flex flex-col items-center justify-center mb-6 border border-tv-primary shadow-lg animate-pulse">
            <TVLoading text={debridMessage || 'Preparing Stream...'} />
        </div>
      )}
      
      <div className="flex flex-col gap-3">
        {streams.map((s, idx) => {
          const isDebrid = s.readiness === PlaybackReadiness.DEBRID_CACHED;
          
          return (
            <FocusItem
              key={s.id || `stream-${idx}`}
              id={`stream-${idx}`}
              groupId={groupId}
              onClick={() => handleStreamSelected(s)}
              className="w-full flex items-center justify-between p-5 rounded-tv-card bg-tv-surface-light hover:bg-tv-surface-lighter transition-all border border-transparent"
              focusedClassName="ring-[3px] ring-white bg-tv-surface-lighter shadow-tv-focus scale-[1.01]"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`w-3 h-3 rounded-full ${isDebrid ? 'bg-purple-500 shadow-[0_0_8px_#a855f7]' : 'bg-tv-success shadow-[0_0_8px_#16a34a]'}`} />
                  <h4 className="text-xl font-bold text-white flex items-center gap-2">
                    {s.quality}
                    {s.hdr && <TVBadge variant="glass">HDR</TVBadge>}
                    {s.dolbyVision && <TVBadge variant="glass">DV</TVBadge>}
                  </h4>
                  <span className="text-sm font-mono text-tv-text-secondary bg-black/40 px-2 py-0.5 rounded uppercase tracking-wider">{s.format}</span>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 mt-1">
                   {isDebrid && <TVBadge variant="glass"><span className="flex items-center gap-1"><DownloadCloud className="w-3.5 h-3.5" /> Debrid Cached</span></TVBadge>}
                   {s.codec && <TVBadge variant="secondary"><span className="flex items-center gap-1"><Cpu className="w-3.5 h-3.5" /> {s.codec}</span></TVBadge>}
                   {s.atmos && <TVBadge variant="secondary"><span className="flex items-center gap-1"><Activity className="w-3.5 h-3.5" /> Atmos</span></TVBadge>}
                   {s.size && <TVBadge variant="secondary"><span className="flex items-center gap-1"><HardDrive className="w-3.5 h-3.5" /> {(s.size / (1024*1024*1024)).toFixed(2)} GB</span></TVBadge>}
                   <TVBadge variant="primary"><span className="flex items-center gap-1"><Server className="w-3.5 h-3.5" /> {s.providerName}</span></TVBadge>
                </div>
              </div>
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10 group-focus:bg-white/20 transition-colors">
                 <Play className="w-6 h-6 text-white" />
              </div>
            </FocusItem>
          );
        })}
      </div>
    </div>
  );
};
