const fs = require('fs');

let tizen = fs.readFileSync('src/types/tizen.ts', 'utf8');
tizen = tizen.replace(/streams: StreamSource\[\];/, 
`streams: StreamSource[];
  externalIds?: {
    tmdbId?: string;
    imdbId?: string;
    tvdbId?: string;
  };`);
fs.writeFileSync('src/types/tizen.ts', tizen);
console.log('Fixed tizen.ts');
