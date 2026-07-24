const fs = require('fs');

let view = fs.readFileSync('src/components/UniversalMediaDetailView.tsx', 'utf8');
view = view.replace(/const \[details, setDetails\] = useState<MediaDetails \| null>\(null\);/, 
`const [details, setDetails] = useState<MediaDetails | null>(null);
  const [error, setError] = useState<string | null>(null);`);

view = view.replace(/const onUpdated = \(e: any\) => \{/, 
`const onFailed = (e: any) => {
      if (e.mediaId === mediaId) {
        setError(e.error?.message || 'Failed to load details. Provider may be unconfigured or offline.');
      }
    };
    const onUpdated = (e: any) => {`);

view = view.replace(/eventBus\.on\(MediaDetailsEventType\.DETAILS_UPDATED, onUpdated\);/, 
`eventBus.on(MediaDetailsEventType.DETAILS_UPDATED, onUpdated);
    eventBus.on(MediaDetailsEventType.DETAILS_FAILED, onFailed);`);

view = view.replace(/eventBus\.off\(MediaDetailsEventType\.DETAILS_UPDATED, onUpdated\);/, 
`eventBus.off(MediaDetailsEventType.DETAILS_UPDATED, onUpdated);
      eventBus.off(MediaDetailsEventType.DETAILS_FAILED, onFailed);`);

view = view.replace(/if \(!details\) \{/, 
`if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-[#050506]/95 flex flex-col items-center justify-center space-y-4">
        <div className="text-red-500 font-bold text-xl flex items-center gap-2">
           <X className="w-8 h-8" /> Metadata Load Failed
        </div>
        <p className="text-zinc-400 text-sm max-w-md text-center">{error}</p>
        <div className="flex gap-4 mt-4">
           <FocusItem id="btn-retry" onClick={() => manager?.loadDetails(mediaType, mediaId)} className="px-6 py-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all font-bold">Retry</FocusItem>
           <FocusItem id="btn-close" onClick={onClose} className="px-6 py-2 bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-all font-bold">Close</FocusItem>
        </div>
      </div>
    );
  }

  if (!details) {`);

fs.writeFileSync('src/components/UniversalMediaDetailView.tsx', view);
console.log('Fixed UniversalMediaDetailView');
