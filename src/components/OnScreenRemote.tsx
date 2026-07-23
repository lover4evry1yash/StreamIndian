/**
 * StreamIndian - On-Screen Samsung Smart TV Remote Control Overlay
 * Enables spatial D-Pad testing directly inside browser dev preview.
 */

import React, { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Play,
  Pause,
  Tv,
  Maximize2,
  Minimize2,
  HelpCircle,
} from 'lucide-react';
import { tizenKeyController } from '../core/tizenKeys';

export const OnScreenRemote: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const simulateKey = (keyCode: number) => {
    const event = new KeyboardEvent('keydown', {
      keyCode: keyCode,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Help Modal */}
      {showHelp && (
        <div className="mb-3 w-72 bg-[#09090b] border border-white/10 text-zinc-200 p-4 rounded-2xl shadow-2xl text-xs space-y-2 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between font-bold text-indigo-400">
            <span>Samsung Remote Shortcuts</span>
            <button onClick={() => setShowHelp(false)} className="text-zinc-400 hover:text-white">✕</button>
          </div>
          <p>• <strong className="text-white">Arrow Keys:</strong> D-Pad Navigation</p>
          <p>• <strong className="text-white">Enter / Return:</strong> Select Active Item</p>
          <p>• <strong className="text-white">Backspace / Esc:</strong> Back Button (Key Code 10009)</p>
          <p>• <strong className="text-white">Spacebar:</strong> Play / Pause Stream</p>
        </div>
      )}

      {/* Main Floating Widget */}
      <div className="bg-[#09090b]/95 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-2xl w-52 flex flex-col items-center gap-3 text-white">
        {/* Widget Header */}
        <div className="w-full flex items-center justify-between text-xs font-bold text-zinc-400 border-b border-white/10 pb-2">
          <span className="flex items-center gap-1.5 text-indigo-400 font-mono">
            <Tv className="w-3.5 h-3.5" /> Remote
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="p-1 hover:text-indigo-400 transition-colors"
              title="Remote Help"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 hover:text-indigo-400 transition-colors"
            >
              {isCollapsed ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {!isCollapsed && (
          <>
            {/* Directional D-Pad Wheel */}
            <div className="relative w-36 h-36 bg-black/80 rounded-full border border-white/10 shadow-inner flex items-center justify-center">
              {/* Up */}
              <button
                onClick={() => simulateKey(38)}
                className="absolute top-1 p-2 rounded-full hover:bg-indigo-600 hover:text-white transition-all text-zinc-300"
                title="Up Arrow (38)"
              >
                <ChevronUp className="w-5 h-5" />
              </button>

              {/* Left */}
              <button
                onClick={() => simulateKey(37)}
                className="absolute left-1 p-2 rounded-full hover:bg-indigo-600 hover:text-white transition-all text-zinc-300"
                title="Left Arrow (37)"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Center OK / ENTER */}
              <button
                onClick={() => simulateKey(13)}
                className="w-12 h-12 rounded-full bg-indigo-600 text-white font-black text-xs shadow-[0_0_12px_rgba(79,70,229,0.5)] border border-indigo-400/50 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
                title="OK / Enter (13)"
              >
                OK
              </button>

              {/* Right */}
              <button
                onClick={() => simulateKey(39)}
                className="absolute right-1 p-2 rounded-full hover:bg-indigo-600 hover:text-white transition-all text-zinc-300"
                title="Right Arrow (39)"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Down */}
              <button
                onClick={() => simulateKey(40)}
                className="absolute bottom-1 p-2 rounded-full hover:bg-indigo-600 hover:text-white transition-all text-zinc-300"
                title="Down Arrow (40)"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>

            {/* Action Row */}
            <div className="grid grid-cols-2 gap-2 w-full pt-1">
              <button
                onClick={() => simulateKey(10009)}
                className="py-1.5 px-3 rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-xs font-bold flex items-center justify-center gap-1 border border-white/10 transition-all"
                title="Back Key (10009)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>BACK</span>
              </button>

              <button
                onClick={() => simulateKey(10252)}
                className="py-1.5 px-3 rounded-xl bg-white/5 hover:bg-indigo-600/20 hover:text-indigo-400 text-xs font-bold flex items-center justify-center gap-1 border border-white/10 transition-all"
                title="Play/Pause (10252)"
              >
                <Play className="w-3 h-3 fill-current" />
                <Pause className="w-3 h-3 fill-current" />
              </button>
            </div>

            {/* Color Softkeys */}
            <div className="flex items-center justify-between w-full pt-1 px-1">
              <button
                onClick={() => simulateKey(403)}
                className="w-4 h-4 rounded-full bg-rose-500 shadow-sm hover:scale-125 transition-transform"
                title="Red Key (403)"
              />
              <button
                onClick={() => simulateKey(404)}
                className="w-4 h-4 rounded-full bg-emerald-500 shadow-sm hover:scale-125 transition-transform"
                title="Green Key (404)"
              />
              <button
                onClick={() => simulateKey(405)}
                className="w-4 h-4 rounded-full bg-amber-400 shadow-sm hover:scale-125 transition-transform"
                title="Yellow Key (405)"
              />
              <button
                onClick={() => simulateKey(406)}
                className="w-4 h-4 rounded-full bg-sky-500 shadow-sm hover:scale-125 transition-transform"
                title="Blue Key (406)"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
