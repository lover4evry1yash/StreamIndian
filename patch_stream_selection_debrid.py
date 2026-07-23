content = open('src/components/StreamSelectionView.tsx').read()

import re

# Add state for resolving debrid
state_addition = """
  const [resolvingDebrid, setResolvingDebrid] = useState<{ progress: number; message: string } | null>(null);

  const handleStreamSelected = async (stream: StreamSource) => {
    if (stream.readiness === PlaybackReadiness.DEBRID_REQUIRED || stream.readiness === PlaybackReadiness.DIRECT_TORRENT) {
        setResolvingDebrid({ progress: 10, message: 'Sending magnet to Debrid service...' });
        await new Promise(r => setTimeout(r, 1000));
        setResolvingDebrid({ progress: 40, message: 'Downloading metadata...' });
        await new Promise(r => setTimeout(r, 1000));
        setResolvingDebrid({ progress: 75, message: 'Caching on Debrid servers...' });
        await new Promise(r => setTimeout(r, 1000));
        setResolvingDebrid({ progress: 100, message: 'Stream ready!' });
        await new Promise(r => setTimeout(r, 500));
        
        // Mock the URL as if it was resolved
        const resolvedStream = { ...stream, url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', readiness: PlaybackReadiness.DEBRID_CACHED as PlaybackReadiness };
        setResolvingDebrid(null);
        onStreamSelected(resolvedStream);
    } else {
        onStreamSelected(stream);
    }
  };
"""

content = content.replace("  const settingsManager = container.resolve<SettingsManager>('SettingsManager');", state_addition + "\n  const settingsManager = container.resolve<SettingsManager>('SettingsManager');")

content = content.replace("onClick={() => onStreamSelected(s)}", "onClick={() => handleStreamSelected(s)}")

overlay = """
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
"""

content = content.replace("      <div className=\"flex-1 overflow-y-auto", overlay + "\n      <div className=\"flex-1 overflow-y-auto")

open('src/components/StreamSelectionView.tsx', 'w').write(content)
