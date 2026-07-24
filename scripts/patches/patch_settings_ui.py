content = open('src/components/SettingsView.tsx').read()

import re

new_sections = """
      <div className="space-y-6 pt-6 border-t border-white/10">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          Stream Ecosystem
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
            <div>
              <p className="font-bold text-white">Preferred Debrid Service</p>
              <p className="text-sm text-zinc-400">Select which cached service to prioritize.</p>
            </div>
            <div className="flex items-center gap-2">
              {['torbox', 'realdebrid'].map(debrid => (
                <FocusItem
                  key={`debrid-${debrid}`}
                  id={`settings-debrid-${debrid}`}
                  groupId="settings"
                  onClick={() => settingsManager.updateSettings({ streams: { ...settings.streams, preferredDebrid: debrid } })}
                  className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                    settings.streams?.preferredDebrid === debrid
                      ? 'bg-indigo-600 text-white border-indigo-400'
                      : 'bg-black/50 text-zinc-400 border-white/10 hover:text-white hover:border-white/30 focus:border-white'
                  }`}
                >
                  {debrid.toUpperCase()}
                </FocusItem>
              ))}
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
            <div>
              <p className="font-bold text-white">Stream Sort Mode</p>
              <p className="text-sm text-zinc-400">How to rank discovered streams.</p>
            </div>
            <div className="flex items-center gap-2">
              {['best', 'quality', 'seeders'].map(mode => (
                <FocusItem
                  key={`sort-${mode}`}
                  id={`settings-sort-${mode}`}
                  groupId="settings"
                  onClick={() => settingsManager.updateSettings({ streams: { ...settings.streams, sortMode: mode as any } })}
                  className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                    settings.streams?.sortMode === mode
                      ? 'bg-indigo-600 text-white border-indigo-400'
                      : 'bg-black/50 text-zinc-400 border-white/10 hover:text-white hover:border-white/30 focus:border-white'
                  }`}
                >
                  {mode.toUpperCase()}
                </FocusItem>
              ))}
            </div>
          </div>
          
          <FocusItem
            id="settings-hide-uncached"
            groupId="settings"
            onClick={() => settingsManager.updateSettings({ streams: { ...settings.streams, hideUncached: !settings.streams?.hideUncached } })}
            className="w-full flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 focus:border-white text-left"
          >
            <div>
              <p className="font-bold text-white">Hide Uncached Torrents</p>
              <p className="text-sm text-zinc-400">Only show streams immediately playable (Cached or HTTP).</p>
            </div>
            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.streams?.hideUncached ? 'bg-indigo-600' : 'bg-black/50 border border-white/20'}`}>
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.streams?.hideUncached ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
          </FocusItem>
        </div>
      </div>
"""

content = content.replace("</div>\n    </div>\n  );\n};", new_sections + "\n    </div>\n  );\n};")
open('src/components/SettingsView.tsx', 'w').write(content)

