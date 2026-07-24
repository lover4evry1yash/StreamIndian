import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, RotateCw, ArrowLeft, Captions, AudioLines, ShieldCheck, Settings } from 'lucide-react';
import { FocusItem } from '../FocusItem';
import { usePlayerOverlayViewModel, useEventBus } from '../../context/ServiceContext';
import { PlaybackState } from '../../core/playback';

interface TVPlayerOverlayProps {
  showOSD: boolean;
  showTracks: boolean;
  onToggleTracks: () => void;
  onClose: () => void;
  resetOSDTimer: () => void;
}

export const TVPlayerOverlay: React.FC<TVPlayerOverlayProps> = ({
  showOSD,
  showTracks,
  onToggleTracks,
  onClose,
  resetOSDTimer
}) => {
  const viewModel = usePlayerOverlayViewModel();
  const eventBus = useEventBus();
  const session = viewModel.getSession();
  
  const playbackState = viewModel.getState();
  const isPlaying = playbackState === PlaybackState.PLAYING;
  
  const progressBarRef = useRef<HTMLDivElement>(null);
  const currentTimeTextRef = useRef<HTMLSpanElement>(null);
  const durationTextRef = useRef<HTMLSpanElement>(null);
  
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const onProgress = (data: any) => {
       if (progressBarRef.current) {
          progressBarRef.current.style.width = `${data.percentageWatched}%`;
       }
       if (currentTimeTextRef.current) {
          currentTimeTextRef.current.textContent = formatTime(data.currentTime);
       }
       if (durationTextRef.current) {
          durationTextRef.current.textContent = formatTime(data.duration);
       }
    };
    eventBus.on('PLAYBACK_PROGRESS', onProgress);
    return () => {
      eventBus.off('PLAYBACK_PROGRESS', onProgress);
    };
  }, [eventBus]);

  const handleSeek = (offset: number) => {
    resetOSDTimer();
    if (offset > 0) {
      viewModel.fastForward(offset);
    } else {
      viewModel.rewind(Math.abs(offset));
    }
  };

  const handlePlayPause = () => {
    resetOSDTimer();
    if (isPlaying) {
      viewModel.pause();
    } else {
      viewModel.play();
    }
  };
  
  if (!session) return null;
  
  const { media, stream, currentTime, duration, bufferingPercentage } = session;

  return (
    <>
      {/* Track Selection Overlay */}
      {showTracks && (
         <div className="absolute top-20 right-20 bg-black/90 p-6 rounded-2xl border border-white/20 shadow-2xl z-50 min-w-[300px]">
             <h3 className="text-white font-bold mb-4 flex items-center gap-2"><AudioLines className="w-5 h-5"/> Audio Tracks</h3>
             <div className="space-y-2 mb-6">
                {viewModel.getAudioTracks().length === 0 && <div className="text-zinc-500 text-sm">No audio tracks available</div>}
                {viewModel.getAudioTracks().map((t, i) => (
                   <FocusItem
                       key={`a-${t.index}`}
                       id={`player-track-audio-${i}`}
                       groupId="player"
                      onClick={() => { viewModel.setAudioTrack(t.index); resetOSDTimer(); }}
                      className={`p-2 rounded-lg ${session.selectedAudioTrack === t.index ? 'bg-indigo-600 text-white' : 'bg-white/5 text-zinc-300 hover:bg-white/10'}`}
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
                    onClick={() => { viewModel.setSubtitleTrack(null); resetOSDTimer(); }}
                    className={`p-2 rounded-lg ${session.selectedSubtitleTrack === null ? 'bg-indigo-600 text-white' : 'bg-white/5 text-zinc-300 hover:bg-white/10'}`}
                 >
                    Off
                 </FocusItem>
                {viewModel.getSubtitleTracks().map((t, i) => (
                   <FocusItem
                       key={`s-${t.index}`}
                       id={`player-track-sub-${i}`}
                       groupId="player"
                      onClick={() => { viewModel.setSubtitleTrack(t.index); resetOSDTimer(); }}
                      className={`p-2 rounded-lg ${session.selectedSubtitleTrack === t.index ? 'bg-indigo-600 text-white' : 'bg-white/5 text-zinc-300 hover:bg-white/10'}`}
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
               onClick={onToggleTracks}
               className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-xl text-white font-bold border border-white/10 hover:bg-indigo-600"
            >
               <Settings className="w-5 h-5" /> Quick Controls
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
                viewModel.seek(clickPosRatio * (duration || 1));
              }}
            >
              <div
                ref={progressBarRef}
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all shadow-[0_0_10px_#4f46e5]"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-zinc-300 font-bold">
              <span ref={currentTimeTextRef}>{formatTime(currentTime)}</span>
              <span ref={durationTextRef}>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Player Buttons */}
          <div className="flex items-center justify-center gap-6">
            <FocusItem
              id="player-rewind"
              groupId="player"
              onClick={() => handleSeek(-10)}
              className="p-3.5 rounded-2xl bg-white/10 text-zinc-200 border border-white/10 hover:text-white focus:bg-white/20"
            >
              <RotateCcw className="w-6 h-6" />
            </FocusItem>
            <FocusItem
              id="player-playpause"
              groupId="player"
              onClick={handlePlayPause}
              className="p-5 rounded-2xl bg-indigo-600 text-white font-black shadow-[0_0_20px_rgba(79,70,229,0.5)] border border-indigo-400/50 focus:bg-indigo-500"
            >
              {isPlaying ? <Pause className="w-8 h-8 fill-white text-white" /> : <Play className="w-8 h-8 fill-white text-white" />}
            </FocusItem>
            <FocusItem
              id="player-forward"
              groupId="player"
              onClick={() => handleSeek(10)}
              className="p-3.5 rounded-2xl bg-white/10 text-zinc-200 border border-white/10 hover:text-white focus:bg-white/20"
            >
              <RotateCw className="w-6 h-6" />
            </FocusItem>
          </div>
        </div>
      </div>
    </>
  );
};
