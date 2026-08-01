import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MediaItem, StreamSource } from '../types/tizen';
import { usePlaybackManager, useEventBus, usePlayerOverlayViewModel } from '../context/ServiceContext';
import { PlaybackState, PlaybackError } from '../core/playback';
import { FocusItem } from './FocusItem';
import { useSpatialFocus } from './SpatialFocusContainer';
import { ShieldAlert } from 'lucide-react';
import { TVPlayerOverlay } from './player/TVPlayerOverlay';

interface TVPlayerProps {
  media: MediaItem;
  stream: StreamSource;
  startTimeSeconds: number;
  onClose: () => void;
}

export const TVPlayer: React.FC<TVPlayerProps> = ({
  media,
  stream,
  startTimeSeconds,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showOSD, setShowOSD] = useState(true);
  const [showTracks, setShowTracks] = useState(false);
  const osdTimerRef = useRef<NodeJS.Timeout>();

  const playbackManager = usePlaybackManager();
  const eventBus = useEventBus();
  const viewModel = usePlayerOverlayViewModel();
  
  const [playbackState, setPlaybackState] = useState<PlaybackState>(PlaybackState.IDLE);
  const [error, setError] = useState<PlaybackError | null>(null);
  const [bufferingPercentage, setBufferingPercentage] = useState(100);

  const { registerGroup, setActiveGroup, setFocusedId } = useSpatialFocus();

  useEffect(() => {
    registerGroup('player', true);
    setActiveGroup('player');
    setTimeout(() => {
       setFocusedId('player-playpause');
    }, 100);
  }, [registerGroup, setActiveGroup, setFocusedId]);

  const playbackStateRef = useRef(playbackState);
  const showTracksRef = useRef(showTracks);
  
  useEffect(() => {
    playbackStateRef.current = playbackState;
  }, [playbackState]);

  useEffect(() => {
    showTracksRef.current = showTracks;
  }, [showTracks]);

  const resetOSDTimer = useCallback(() => {
    setShowOSD(true);
    if (osdTimerRef.current) clearTimeout(osdTimerRef.current);
    if (playbackStateRef.current === PlaybackState.PLAYING && !showTracksRef.current) {
      osdTimerRef.current = setTimeout(() => {
        setShowOSD(false);
      }, 5000); // 5s idle to hide
    }
  }, []);

  useEffect(() => {
    resetOSDTimer();
    return () => {
      if (osdTimerRef.current) clearTimeout(osdTimerRef.current);
    };
  }, [resetOSDTimer]);

  useEffect(() => {
    if (videoRef.current) {
      playbackManager.registerVideoContainer(videoRef.current);
      playbackManager.playStream(stream, media, startTimeSeconds);
    }
    
    // Wire up event bus listeners for state updates that trigger React re-renders.
    // Progress is intentionally excluded from state to avoid 60fps React re-renders.
    // The overlay component will read from the session directly or via refs if needed,
    // actually wait, if we want React to re-render progress we would use a different approach.
    // For now we just use a small hook or local state inside overlay if needed,
    // but the overlay can also use forceUpdate on a ref or subscribe to progress event.
    
    const onStateChanged = (data: any) => {
        setPlaybackState(data.state);
        resetOSDTimer();
    };
    const onError = (data: any) => {
        setError(data.error);
        setPlaybackState(PlaybackState.ERROR);
    };
    const onBuffer = (data: any) => {
        setBufferingPercentage(data.percentage);
    };
    
    eventBus.on('PLAYBACK_STATE_CHANGED', onStateChanged);
    eventBus.on('PLAYBACK_ERROR', onError);
    eventBus.on('PLAYBACK_BUFFER', onBuffer);

    return () => {
      eventBus.off('PLAYBACK_STATE_CHANGED', onStateChanged);
      eventBus.off('PLAYBACK_ERROR', onError);
      eventBus.off('PLAYBACK_BUFFER', onBuffer);
      playbackManager.stop();
      playbackManager.clearVideoContainer();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media.id, stream.id, startTimeSeconds]);

  // If we have an error, show the error state overlay
  if (error) {
     return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-12 text-center overflow-hidden">
            <ShieldAlert className="w-16 h-16 text-red-500 mb-6" />
            <h2 className="text-3xl font-black text-white mb-4">Playback Failed</h2>
            <p className="text-zinc-400 text-lg max-w-2xl mb-8">{error.message}</p>
            <FocusItem id="player-error-close" groupId="player" onClick={onClose} className="px-6 py-3 bg-zinc-800 text-white rounded-xl focus:bg-indigo-600 focus:outline-none border-2 border-transparent focus:border-white">
               Go Back
            </FocusItem>
        </div>
     );
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden"
      onMouseMove={resetOSDTimer}
      onClick={resetOSDTimer}
    >
      {/* Native AVPlay Video Stage */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        autoPlay
        playsInline
      />

      {/* Buffering Indicator */}
      {(playbackState === PlaybackState.LOADING || playbackState === PlaybackState.BUFFERING) && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-indigo-400 font-bold text-sm tracking-wider">
            {playbackState === PlaybackState.LOADING ? 'Loading Stream...' : `AVPlay Buffering (${bufferingPercentage}%)...`}
          </p>
        </div>
      )}

      {/* Extracted Overlay UI */}
      <TVPlayerOverlay
        showOSD={showOSD}
        showTracks={showTracks}
        onToggleTracks={() => {
           setShowTracks(!showTracks);
           resetOSDTimer();
        }}
        onClose={onClose}
        resetOSDTimer={resetOSDTimer}
      />
    </div>
  );
};
