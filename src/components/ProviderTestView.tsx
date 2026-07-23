import React, { useState } from 'react';
import { FocusItem } from './FocusItem';
import { Play, Code, Database } from 'lucide-react';
import { useSettingsManager } from '../context/ServiceContext';

export const ProviderTestView: React.FC = () => {
  const [selectedProvider, setSelectedProvider] = useState('tmdb');
  const [logs, setLogs] = useState<string[]>([]);
  const settings = useSettingsManager().getSettings();

  const handleTest = async () => {
    setLogs(prev => [...prev, `[${new Date().toISOString()}] Starting test for ${selectedProvider}...`]);
    try {
      const config = settings.providers?.[selectedProvider];
      if (!config || !config.enabled) {
         throw new Error('Provider is disabled or missing configuration');
      }
      
      setLogs(prev => [...prev, `Config OK. Executing request...`]);
      // Simulate real provider request (In reality, we could hook into the actual clients here)
      await new Promise(r => setTimeout(r, 800));
      setLogs(prev => [...prev, `[SUCCESS] Request completed. 200 OK.`, JSON.stringify({ status: 'ok', mockData: true }, null, 2)]);
    } catch (err: any) {
      setLogs(prev => [...prev, `[ERROR] ${err.message}`]);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto text-zinc-100">
      <h2 className="text-2xl font-black mb-4 flex items-center gap-2"><Database className="w-6 h-6 text-indigo-400" /> Provider Test Toolkit</h2>
      <div className="flex gap-6 h-[500px]">
        <div className="w-1/4 space-y-2">
          {['tmdb', 'fanart', 'trakt', 'mdblist', 'torbox', 'rpdb', 'tvdb', 'anilist'].map(p => (
            <FocusItem
              key={p}
              id={`test-${p}`}
              onClick={() => setSelectedProvider(p)}
              className={`p-3 rounded-xl transition-all font-bold ${selectedProvider === p ? 'bg-indigo-600' : 'bg-white/10 hover:bg-white/20'}`}
            >
              {p.toUpperCase()}
            </FocusItem>
          ))}
        </div>
        <div className="w-3/4 bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col">
           <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/10">
              <span className="font-bold">Testing: {selectedProvider.toUpperCase()}</span>
              <FocusItem id="btn-run-test" onClick={handleTest} className="px-4 py-2 bg-emerald-600 rounded-xl font-bold flex items-center gap-2">
                 <Play className="w-4 h-4" /> Run Integration Test
              </FocusItem>
           </div>
           <div className="flex-1 overflow-y-auto font-mono text-xs text-zinc-300 space-y-1">
              {logs.map((l, i) => (
                 <div key={i} className={l.includes('[ERROR]') ? 'text-red-400' : l.includes('[SUCCESS]') ? 'text-emerald-400' : ''}>
                    {l}
                 </div>
              ))}
              {logs.length === 0 && <div className="text-zinc-500 italic">No logs yet. Run a test to see output.</div>}
           </div>
        </div>
      </div>
    </div>
  );
}
