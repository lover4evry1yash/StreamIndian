const fs = require('fs');
let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

// find the exact lines to replace
let start = lines.findIndex(l => l.includes('const handleKeyDown = (e: KeyboardEvent) => {'));
let end = lines.findIndex((l, i) => i > start && l.includes('window.addEventListener(\'keydown\', handleKeyDown);'));

if (start > -1 && end > -1) {
  lines.splice(start, end - start + 2, 
    '    const handleKeyDown = (e: KeyboardEvent) => {',
    '      if (e.key === \'d\' || e.key === \'D\') {',
    '         setActiveTab(prev => prev === \'nav-audit\' ? \'nav-home\' : \'nav-audit\');',
    '      }',
    '    };',
    '    window.addEventListener(\'keydown\', handleKeyDown);',
    '    return () => window.removeEventListener(\'keydown\', handleKeyDown);'
  );
  fs.writeFileSync('src/App.tsx', lines.join('\n'));
  console.log('Fixed App.tsx completely');
} else {
  console.log('Could not find block');
}
