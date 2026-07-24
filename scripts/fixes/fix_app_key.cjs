const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

if (!app.includes("if (e.key === 'd' || e.key === 'D')")) {
  app = app.replace(/useEffect\(\(\) => \{/,
`useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'd' || e.key === 'D') {
         if (e.ctrlKey) {
            setActiveTab(prev => prev === 'nav-audit' ? 'nav-home' : 'nav-audit');
         }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  useEffect(() => {`);
  fs.writeFileSync('src/App.tsx', app);
  console.log('Fixed App.tsx global key');
}
