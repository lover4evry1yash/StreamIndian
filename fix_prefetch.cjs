const fs = require('fs');

let pf = fs.readFileSync('src/core/rendering/PrefetchManager.ts', 'utf8');
pf = pf.replace(/if \(type === 'movie' \|\| type === 'series'\) \{\n           await this\.metadataManager\.prefetch\(type, id\);\n        \}/, 
`if (type === 'movie' || type === 'series') {
           await this.metadataManager.prefetch(type, id);
           // After metadata is cached, we prefetch the poster image
           const virtualUrl = \`artwork://\${type}/\${id}/poster\`;
           await this.artworkManager.preloadImage(virtualUrl, 'low');
        }`);
fs.writeFileSync('src/core/rendering/PrefetchManager.ts', pf);
console.log('Fixed PrefetchManager');
