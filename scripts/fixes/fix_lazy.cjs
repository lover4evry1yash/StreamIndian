const fs = require('fs');
let li = fs.readFileSync('src/components/LazyImage.tsx', 'utf8');

li = li.replace(/imageManager\.registerDisplay\(loadedSrc\);/g, 'imageManager.registerDisplay(src);');
li = li.replace(/imageManager\.unregisterDisplay\(loadedSrc\);/g, 'imageManager.unregisterDisplay(src);');

fs.writeFileSync('src/components/LazyImage.tsx', li);
console.log('Fixed LazyImage');
