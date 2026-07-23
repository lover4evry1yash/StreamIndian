const fs = require('fs');

let view = fs.readFileSync('src/components/UniversalMediaDetailView.tsx', 'utf8');

view = view.replace(/<div className="flex items-center gap-4 text-sm font-bold text-zinc-300">/, 
`<div className="flex items-center gap-4 text-sm font-bold text-zinc-300">
                <span className="px-2 py-0.5 bg-indigo-600/30 text-indigo-300 rounded text-xs border border-indigo-500/30">TMDB Metadata</span>`);

fs.writeFileSync('src/components/UniversalMediaDetailView.tsx', view);
console.log('Fixed UniversalMediaDetailView badges');
