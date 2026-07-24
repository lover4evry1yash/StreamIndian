const fs = require('fs');

let wl = fs.readFileSync('src/components/WatchlistHistoryView.tsx', 'utf8');
if (!wl.includes('import { LazyImage }')) {
  wl = wl.replace(/import \{ FocusItem \} from '\.\/FocusItem';/, "import { FocusItem } from './FocusItem';\nimport { LazyImage } from './LazyImage';");
}
wl = wl.replace(/<img\s+src=\{rec\.posterUrl\}\s+alt=\{rec\.title\}\s+className="w-16 h-22 object-cover rounded-xl shadow-md flex-shrink-0"\s+\/>/m, 
`<LazyImage
                  src={rec.posterUrl}
                  alt={rec.title}
                  className="w-16 h-22 object-cover rounded-xl shadow-md flex-shrink-0"
                />`);
fs.writeFileSync('src/components/WatchlistHistoryView.tsx', wl);
console.log('Fixed Watchlist');
