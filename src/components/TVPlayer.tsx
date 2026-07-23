/**
 * StreamIndian - Fullscreen Samsung AVPlay TV Player
 * Renders video container, AVPlay controller bridge, TV On-Screen Display (OSD), controls & progress updates.
 */

import React, { useEffect, useRef, useState } from 'react';
import { MediaItem, StreamSource } from '../types/tizen';
import { usePlaybackManager, useEventBus } from '../context/ServiceContext';
import { PlaybackManager, PlaybackState, PlaybackSession, PlaybackError, PlaybackErrorCategory } from '../core/playback';
import { FocusItem } from './FocusItem';
import { useSpatialFocus } from './SpatialFocusContainer';
import { Play, Pause, RotateCcw, RotateCw, ArrowLeft, Volume2, VolumeX, ShieldCheck, Captions, AudioLines } from 'lucide-react';
import { StreamIndianStorage } from '../core/storage';
import { EventBus } from '../core/EventBus';

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

  // Playback State
  const playbackManager = usePlaybackManager();
  const eventBus = useEventBus();
  
  const [playbackState, setPlaybackState] = useState<PlaybackState>(PlaybackState.IDLE);
  const [bufferingPercentage, setBufferingPercentage] = useState(100);
  const [error, setError] = useState<PlaybackError | null>(null);
  
  const [showTracks, setShowTracks] = useState(false);
  const [audioTracks, setAudioTracks] = useState(playbackManager.getAudioTracks());
  const [subTracks, setSubTracks] = useState(playbackManager.getSubtitleTracks());

  const currentTimeTextRef = useRef<HTMLSpanElement>(null);
  const durationTextRef = useRef<HTMLSpanElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  // Keep track of duration for seeking calculations
  const durationRef = useRef(0);
  const currentTimeRef = useRef(startTimeSeconds);

  // Hook to register the player focus group
  const { registerGroup, setFocusedId } = useSpatialFocus();

  useEffect(() => {
    registerGroup('player', true);
    setFocusedId('player-playpause');
  }, [registerGroup, setFocusedId]);
  
  const osdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const trackFocusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize player engine
  useEffect(() => {
    if (!stream || !stream.url) {
      setError({
        category: PlaybackErrorCategory.NO_STREAM_AVAILABLE,
        message: 'No playable stream available.',
      });
      return;
    }

    if (videoRef.current) {
      playbackManager.registerVideoContainer(videoRef.current);
    }

    playbackManager.playStream(stream, media.id, media.title, startTimeSeconds);

    const handleState = (e: { state: PlaybackState }) => setPlaybackState(e.state);
    const handleProgress = (e: { currentTime: number; duration: number }) => {
       durationRef.current = e.duration;
       currentTimeRef.current = e.currentTime;
       
       if (currentTimeTextRef.current) {
         currentTimeTextRef.current.innerText = formatTime(e.currentTime);
       }
       if (durationTextRef.current) {
         durationTextRef.current.innerText = formatTime(e.duration);
       }
       if (progressBarRef.current && e.duration > 0) {
         progressBarRef.current.style.width = `${(e.currentTime / e.duration) * 100}%`;
       }
    };
    const handleBuffer = (e: { percentage: number }) => setBufferingPercentage(e.percentage);
    const handleError = (e: { error: PlaybackError }) => setError(e.error);
    const handleTrackChange = () => {
        // Just triggering re-render if needed, though session tracks could be bound
    };

    eventBus.on('PLAYBACK_STATE_CHANGED', handleState);
    eventBus.on('PLAYBACK_PROGRESS', handleProgress);
    eventBus.on('PLAYBACK_BUFFER', handleBuffer);
    eventBus.on('PLAYBACK_ERROR', handleError);
    eventBus.on('PLAYBACK_TRACK_CHANGED', handleTrackChange);

    resetOSDTimer();

    return () => {
      playbackManager.stop();
      eventBus.off('PLAYBACK_STATE_CHANGED', handleState);
      eventBus.off('PLAYBACK_PROGRESS', handleProgress);
      eventBus.off('PLAYBACK_BUFFER', handleBuffer);
      eventBus.off('PLAYBACK_ERROR', handleError);
      eventBus.off('PLAYBACK_TRACK_CHANGED', handleTrackChange);
      if (osdTimeoutRef.current) clearTimeout(osdTimeoutRef.current);
      if (trackFocusTimeoutRef.current) clearTimeout(trackFocusTimeoutRef.current);
    };
  }, [media, stream, startTimeSeconds, playbackManager, eventBus]);

  const resetOSDTimer = () => {
    setShowOSD(true);
    if (osdTimeoutRef.current) clearTimeout(osdTimeoutRef.current);
    osdTimeoutRef.current = setTimeout(() => {
      setShowOSD(false);
      setShowTracks(false);
    }, 5000);
  };

  const handlePlayPause = () => {
    resetOSDTimer();
    if (playbackState === PlaybackState.PLAYING || playbackState === PlaybackState.BUFFERING) {
      playbackManager.pause();
    } else {
      playbackManager.play();
    }
  };

  const handleSeek = (deltaSeconds: number) => {
    resetOSDTimer();
    if (deltaSeconds < 0) {
       playbackManager.rewind(Math.abs(deltaSeconds));
    } else {
       playbackManager.fastForward(deltaSeconds);
    }
  };
  
  const handleToggleTracks = () => {
     resetOSDTimer();
     setShowTracks(!showTracks);
     setAudioTracks(playbackManager.getAudioTracks());
     setSubTracks(playbackManager.getSubtitleTracks());
     if (trackFocusTimeoutRef.current) clearTimeout(trackFocusTimeoutRef.current);
     trackFocusTimeoutRef.current = setTimeout(() => setFocusedId(showTracks ? 'player-playpause' : 'player-track-audio-0'), 50);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) {
      return `${hrs}:${(mins % 60).toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isPlaying = playbackState === PlaybackState.PLAYING || playbackState === PlaybackState.BUFFERING;
  const session = playbackManager.getSession();

  if (error) {
     return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
            <h1 className="text-3xl font-bold text-rose-500 mb-4">Playback Error</h1>
            <p className="text-zinc-300 mb-8">{error.message}</p>
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

      {/* Track Selection Overlay */}
      {showTracks && (
         <div className="absolute top-20 right-20 bg-black/90 p-6 rounded-2xl border border-white/20 shadow-2xl z-50 min-w-[300px]">
             <h3 className="text-white font-bold mb-4 flex items-center gap-2"><AudioLines className="w-5 h-5"/> Audio Tracks</h3>
             <div className="space-y-2 mb-6">
                {audioTracks.length === 0 && <div className="text-zinc-500 text-sm">No audio tracks available</div>}
                {audioTracks.map((t, i) => (
                   <FocusItem 
                      key={`a-${t.index}`} 
                      id={`player-track-audio-${i}`} 
                      groupId="player"
                      onClick={() => { playbackManager.setAudioTrack(t.index); resetOSDTimer(); }}
                      className={`p-2 rounded-lg ${session?.selectedAudioTrack === t.language ? 'bg-indigo-600 text-white' : 'bg-white/5 text-zinc-300 hover:bg-white/10'}`}
                   >
                      {t.language}
                   </FocusItem>
                ))}
             </div>
             <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Captions className="w-5 h-5"/> Subtitles</h3>
             <div className="space-y-2">
                <FocusItem 
                    id={`player-track-sub-off`} 
                    groupId="player"
                    onClick={() => { playbackManager.setSubtitleTrack(null); resetOSDTimer(); }}
                    className={`p-2 rounded-lg ${session?.selectedSubtitleTrack === null ? 'bg-indigo-600 text-white' : 'bg-white/5 text-zinc-300 hover:bg-white/10'}`}
                 >
                    Off
                 </FocusItem>
                {subTracks.map((t, i) => (
                   <FocusItem 
                      key={`s-${t.index}`} 
                      id={`player-track-sub-${i}`} 
                      groupId="player"
                      onClick={() => { playbackManager.setSubtitleTrack(t.index); resetOSDTimer(); }}
                      className={`p-2 rounded-lg ${session?.selectedSubtitleTrack === t.language ? 'bg-indigo-600 text-white' : 'bg-white/5 text-zinc-300 hover:bg-white/10'}`}
                   >
                      {t.language}
                   </FocusItem>
                ))}
             </div>
         </div>
      )}

      {/* TV On-Screen Display (OSD) Overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-[#050506] via-[#050506]/30 to-[#050506]/80 p-8 md:p-12 flex flex-col justify-between transition-opacity duration-300 pointer-events-auto ${
          showOSD ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* OSD Top Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <FocusItem
              id="player-back"
              groupId="player"
              onClick={onClose}
              className="p-3 rounded-2xl bg-white/10 text-white hover:bg-indigo-600 border border-white/10"
            >
              <ArrowLeft className="w-6 h-6" />
            </FocusItem>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white font-bold text-xs uppercase">
                  {media.language}
                </span>
                <span className="text-xs text-indigo-400 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Samsung AVPlay
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white mt-0.5">
                {media.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <FocusItem
               id="player-tracks-btn"
               groupId="player"
               onClick={handleToggleTracks}
               className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-xl text-white font-bold border border-white/10 hover:bg-indigo-600"
            >
               <Captions className="w-5 h-5" /> Tracks
            </FocusItem>
            <div className="flex items-center gap-2 text-xs font-mono font-bold bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 text-indigo-400">
              <span>{stream?.quality || 'Unknown'}</span>
              <span>•</span>
              <span>{stream?.format || 'mp4'}</span>
            </div>
          </div>
        </div>

        {/* OSD Bottom Controls & Scrubber */}
        <div className="space-y-4 max-w-4xl mx-auto w-full">
          {/* Timeline Bar */}
          <div className="space-y-1">
            <div
              className="relative w-full h-3 bg-white/10 rounded-full overflow-hidden cursor-pointer border border-white/10"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickPosRatio = (e.clientX - rect.left) / rect.width;
                playbackManager.seek(clickPosRatio * (durationRef.current || 1));
              }}
            >
              <div
                ref={progressBarRef}
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all shadow-[0_0_10px_#4f46e5]"
                style={{ width: `${durationRef.current > 0 ? (currentTimeRef.current / durationRef.current) * 100 : 0}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-zinc-300 font-bold">
              <span ref={currentTimeTextRef}>{formatTime(currentTimeRef.current)}</span>
              <span ref={durationTextRef}>{formatTime(durationRef.current)}</span>
            </div>
          </div>

          {/* Player Buttons */}
          <div className="flex items-center justify-center gap-6">
            <FocusItem
              id="player-rewind"
              groupId="player"
              onClick={() => handleSeek(-10)}
              className="p-3.5 rounded-2xl bg-white/10 text-zinc-200 border border-white/10 hover:text-white"
            >
              <RotateCcw className="w-6 h-6" />
            </FocusItem>

            <FocusItem
              id="player-playpause"
              groupId="player"
              onClick={handlePlayPause}
              className="p-5 rounded-2xl bg-indigo-600 text-white font-black shadow-[0_0_20px_rgba(79,70,229,0.5)] border border-indigo-400/50"
            >
              {isPlaying ? <Pause className="w-8 h-8 fill-white text-white" /> : <Play className="w-8 h-8 fill-white text-white" />}
            </FocusItem>

            <FocusItem
              id="player-forward"
              groupId="player"
              onClick={() => handleSeek(10)}
              className="p-3.5 rounded-2xl bg-white/10 text-zinc-200 border border-white/10 hover:text-white"
            >
              <RotateCw className="w-6 h-6" />
            </FocusItem>
          </div>
        </div>
      </div>
    </div>
  );
};
