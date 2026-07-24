import re

content = open('src/App.tsx').read()

# I will just remove all Suspense tags and then add them back properly.
content = content.replace("</Suspense>", "")
content = content.replace("<Suspense fallback={<div />}>", "")
content = content.replace("<Suspense fallback={<div className=\"fixed inset-0 z-50 bg-[#050506]/95\"><SkeletonDetails /></div>}>", "")
content = content.replace("<Suspense fallback={<div className=\"fixed inset-0 z-50 bg-black flex items-center justify-center\"><div className=\"w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin\"></div></div>}>", "")
content = content.replace("<Suspense fallback={<div className=\"p-12\"><div className=\"animate-pulse bg-white/10 w-full h-32 rounded-xl\" /></div>}>", "")

# Now I'll add them back explicitly to the lazy-loaded components
content = content.replace("{activeTab === 'nav-search' && (", "<Suspense fallback={<div className=\"p-12\"><div className=\"animate-pulse bg-white/10 w-full h-32 rounded-xl\" /></div>}>\n        {activeTab === 'nav-search' && (")
content = content.replace("selectedLanguage={selectedLanguage}\n          />\n        )}", "selectedLanguage={selectedLanguage}\n          />\n        )}\n        </Suspense>")

content = content.replace("{activeTab === 'nav-watchlist' && <WatchlistHistoryView onSelectMedia={setSelectedMedia} />}", "<Suspense fallback={<div />}>{activeTab === 'nav-watchlist' && <WatchlistHistoryView onSelectMedia={setSelectedMedia} />}</Suspense>")
content = content.replace("{activeTab === 'nav-audit' && <AuditPanel />}", "<Suspense fallback={<div />}>{activeTab === 'nav-audit' && <AuditPanel />}</Suspense>")
content = content.replace("{activeTab === 'nav-settings' && <SettingsView />}", "<Suspense fallback={<div />}>{activeTab === 'nav-settings' && <SettingsView />}</Suspense>")

content = content.replace("{selectedMedia && (\n          <UniversalMediaDetailView", "<Suspense fallback={<div className=\"fixed inset-0 z-50 bg-[#050506]/95\"><SkeletonDetails /></div>}>\n        {selectedMedia && (\n          <UniversalMediaDetailView")
content = content.replace("startPosition || 0);\n            }}\n          />\n        )}", "startPosition || 0);\n            }}\n          />\n        )}\n        </Suspense>")

content = content.replace("{activePlayback && (\n          <TVPlayer", "<Suspense fallback={<div className=\"fixed inset-0 z-50 bg-black flex items-center justify-center\"><div className=\"w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin\"></div></div>}>\n        {activePlayback && (\n          <TVPlayer")
content = content.replace("startTimeSeconds={activePlayback.startTimeSeconds}\n            onClose={() => setActivePlayback(null)}\n          />\n        )}", "startTimeSeconds={activePlayback.startTimeSeconds}\n            onClose={() => setActivePlayback(null)}\n          />\n        )}\n        </Suspense>")

open('src/App.tsx', 'w').write(content)
