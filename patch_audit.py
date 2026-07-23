content = open('src/components/AuditPanel.tsx').read()

import re

# Add resolutionManager
content = content.replace("const avplayManager = container.resolve<AVPlayManager>('AVPlayManager');", "const avplayManager = container.resolve<AVPlayManager>('AVPlayManager');\n  const resolutionManager = container.resolve<any>('ResolutionManager');\n  const sourceManager = container.resolve<any>('SourceManager');")

# Add 'streams' tab
content = content.replace("useState<'overview' | 'providers' | 'tizen' | 'legacy'>('overview');", "useState<'overview' | 'providers' | 'tizen' | 'legacy' | 'streams'>('overview');")

tab_button = """
          <FocusItem
            id="audit-tab-streams"
            groupId="audit"
            onClick={() => setActiveTab('streams')}
            className={`px-4 py-2 font-bold text-sm transition-all ${
              activeTab === 'streams' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Streams & Debrid
          </FocusItem>
"""
content = content.replace("          {/* Navigation */}", "          {/* Navigation */}\n" + tab_button)

tab_content = """
        {activeTab === 'streams' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2"><Layers className="w-5 h-5 text-indigo-400"/> Stream Pipeline Diagnostics</h3>
            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <h4 className="font-bold text-indigo-400 mb-2">Sources (Providers)</h4>
                  <pre className="text-xs text-zinc-300 overflow-auto max-h-32">
{JSON.stringify(sourceManager.getDiagnostics(), null, 2)}
                  </pre>
               </div>
               <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <h4 className="font-bold text-purple-400 mb-2">Resolvers (Debrid)</h4>
                  <pre className="text-xs text-zinc-300 overflow-auto max-h-32">
{JSON.stringify(resolutionManager.getDiagnostics(), null, 2)}
                  </pre>
               </div>
            </div>
          </div>
        )}
"""

content = content.replace("        {activeTab === 'legacy' && (", tab_content + "\n        {activeTab === 'legacy' && (")

open('src/components/AuditPanel.tsx', 'w').write(content)
