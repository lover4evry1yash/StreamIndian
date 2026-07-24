const fs = require('fs');
let content = fs.readFileSync('src/components/SettingsView.tsx', 'utf8');

if (!content.includes('import { SettingsProvidersView }')) {
  content = content.replace(/import \{ FocusItem \} from '\.\/FocusItem';/, 
  "import { FocusItem } from './FocusItem';\nimport { SettingsProvidersView } from './SettingsProvidersView';");
}

if (!content.includes('<SettingsProvidersView />')) {
  content = content.replace(/\{AllLangs.*\}?\n?.*<\/section>/m, 
`{/* Compliance & Security */}
      <section className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-3">
        <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
          <Shield className="w-4 h-4" /> Legal Source Guarantee
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          StreamIndian strictly index-serves legal public streams and personal media sources. Unauthorized streams or paid bypass routines are prohibited.
        </p>
      </section>
      
      {/* Provider Settings */}
      <section className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
        <div className="flex items-center gap-2 font-bold text-sm text-indigo-400">
          <Sparkles className="w-4 h-4" /> Provider Configuration
        </div>
        <p className="text-xs text-zinc-400">Configure API keys for metadata and stream providers. Missing keys will disable the provider.</p>
        <SettingsProvidersView />
      </section>`);
}

fs.writeFileSync('src/components/SettingsView.tsx', content);
console.log('Fixed SettingsView');
