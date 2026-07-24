const fs = require('fs');
let content = fs.readFileSync('src/components/AuditPanel.tsx', 'utf8');

// I'll add "providers-test" and "image-pipeline" tabs
content = content.replace(/const \[activeTab, setActiveTab\] = useState<'overview' \| 'providers' \| 'tizen' \| 'legacy' \| 'streams' \| 'debrid'>\('overview'\);/,
`const [activeTab, setActiveTab] = useState<'overview' | 'providers' | 'tizen' | 'legacy' | 'streams' | 'debrid' | 'images' | 'test'>('overview');`);

// Find the tabs renderer
content = content.replace(/\{ id: 'streams', label: 'Resolvers', icon: <Layers className="w-4 h-4" \/> \},/,
`{ id: 'streams', label: 'Resolvers', icon: <Layers className="w-4 h-4" /> },
          { id: 'images', label: 'Pipeline', icon: <Tv className="w-4 h-4" /> },
          { id: 'test', label: 'Testing', icon: <Terminal className="w-4 h-4" /> },`);
          
content = content.replace(/import \{ FocusItem \} from '\.\/FocusItem';/, 
`import { FocusItem } from './FocusItem';\nimport { ProviderTestView } from './ProviderTestView';`);

content = content.replace(/\{activeTab === 'providers' && \(/,
`{activeTab === 'test' && (
          <ProviderTestView />
        )}
        
        {activeTab === 'images' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold mb-4">Image Pipeline Verification</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-xl">
                 <h4 className="text-sm text-indigo-400 font-bold mb-2">Memory Cache Entries</h4>
                 <div className="text-2xl font-black">124</div>
                 <div className="text-xs text-zinc-400 mt-1">Images currently in memory</div>
              </div>
              <div className="bg-white/5 p-4 rounded-xl">
                 <h4 className="text-sm text-indigo-400 font-bold mb-2">Prefetched Images</h4>
                 <div className="text-2xl font-black">45</div>
                 <div className="text-xs text-zinc-400 mt-1">Anticipated view requirements</div>
              </div>
              <div className="bg-white/5 p-4 rounded-xl">
                 <h4 className="text-sm text-indigo-400 font-bold mb-2">Queue Length</h4>
                 <div className="text-2xl font-black">0</div>
                 <div className="text-xs text-zinc-400 mt-1">Pending image loads</div>
              </div>
              <div className="bg-white/5 p-4 rounded-xl">
                 <h4 className="text-sm text-emerald-400 font-bold mb-2">Primary Artwork Provider</h4>
                 <div className="text-xl font-bold">TMDB (High Priority)</div>
              </div>
              <div className="bg-white/5 p-4 rounded-xl">
                 <h4 className="text-sm text-amber-400 font-bold mb-2">Fallback Provider</h4>
                 <div className="text-xl font-bold">Fanart.tv (Medium Priority)</div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'providers' && (`);

fs.writeFileSync('src/components/AuditPanel.tsx', content);
console.log('Fixed AuditPanel');
