const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

app = app.replace(/useEffect\(\(\) => \{\n    const handleKeyDown = \(e: KeyboardEvent\) => \{\n      if \(e\.key === 'd' \|\| e\.key === 'D'\) \{\n                  \}\n      \}\n    \};\n    window\.addEventListener\('keydown', handleKeyDown\);\n    return \(\) => window\.removeEventListener\('keydown', handleKeyDown\);\n  \}, \[\]\);/,
`useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'd' || e.key === 'D') {
         setActiveTab(prev => prev === 'nav-audit' ? 'nav-home' : 'nav-audit');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);`);
fs.writeFileSync('src/App.tsx', app);
console.log('Fixed App.tsx global key again');
