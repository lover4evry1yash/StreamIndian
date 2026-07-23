import re

content = open('src/App.tsx').read()

replacements = [
    ("import { UniversalMediaDetailView } from './components/UniversalMediaDetailView';", "const UniversalMediaDetailView = React.lazy(() => import('./components/UniversalMediaDetailView').then(module => ({ default: module.UniversalMediaDetailView })));"),
    ("import { TVPlayer } from './components/TVPlayer';", "const TVPlayer = React.lazy(() => import('./components/TVPlayer').then(module => ({ default: module.TVPlayer })));"),
    ("import { AuditPanel } from './components/AuditPanel';", "const AuditPanel = React.lazy(() => import('./components/AuditPanel').then(module => ({ default: module.AuditPanel })));"),
    ("import { SearchView } from './components/SearchView';", "const SearchView = React.lazy(() => import('./components/SearchView').then(module => ({ default: module.SearchView })));"),
    ("import { WatchlistHistoryView } from './components/WatchlistHistoryView';", "const WatchlistHistoryView = React.lazy(() => import('./components/WatchlistHistoryView').then(module => ({ default: module.WatchlistHistoryView })));"),
    ("import { SettingsView } from './components/SettingsView';", "const SettingsView = React.lazy(() => import('./components/SettingsView').then(module => ({ default: module.SettingsView })));")
]

for old, new in replacements:
    content = content.replace(old, new)

# add suspense wrapper logic.
# Wait, let's just make a simple wrapper since Suspense might need to wrap the whole layout.
content = content.replace("import React, { useEffect, useState } from 'react';", "import React, { useEffect, useState, Suspense } from 'react';\nimport { SkeletonDetails } from './components/SkeletonRenderer';")

content = content.replace("<TVNavbar", "<Suspense fallback={<div />}>\n        <TVNavbar")

# Find the end of TVNavbar or the end of the main view? We can just wrap the conditionally rendered views.
# Actually, it's easier to just wrap the whole return block inside SpatialFocusProvider.
old_return = """    <SpatialFocusProvider
      onBackKey={() => {"""

new_return = """    <SpatialFocusProvider
      onBackKey={() => {"""

content = content.replace(old_return, new_return)

content = content.replace("{activeTab === 'nav-search' && <SearchView />}", "<Suspense fallback={<div className=\"p-12\"><div className=\"animate-pulse bg-white/10 w-full h-32 rounded-xl\" /></div>}>{activeTab === 'nav-search' && <SearchView />}</Suspense>")
content = content.replace("{activeTab === 'nav-watchlist' && (\n          <WatchlistHistoryView onSelectMedia={setSelectedMedia} />\n        )}", "<Suspense fallback={<div />}>{activeTab === 'nav-watchlist' && <WatchlistHistoryView onSelectMedia={setSelectedMedia} />}</Suspense>")
content = content.replace("{activeTab === 'nav-audit' && <AuditPanel />}", "<Suspense fallback={<div />}>{activeTab === 'nav-audit' && <AuditPanel />}</Suspense>")
content = content.replace("{activeTab === 'nav-settings' && <SettingsView />}", "<Suspense fallback={<div />}>{activeTab === 'nav-settings' && <SettingsView />}</Suspense>")

detail_old = """{selectedMedia && (
          <UniversalMediaDetailView"""
detail_new = """<Suspense fallback={<div className="fixed inset-0 z-50 bg-[#050506]/95"><SkeletonDetails /></div>}>
        {selectedMedia && (
          <UniversalMediaDetailView"""
content = content.replace(detail_old, detail_new)
content = content.replace("/>\n        )}", "/>\n        )}\n        </Suspense>")

player_old = """{activePlayback && (
          <TVPlayer"""
player_new = """<Suspense fallback={<div className="fixed inset-0 z-50 bg-black flex items-center justify-center"><div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>}>
        {activePlayback && (
          <TVPlayer"""
content = content.replace(player_old, player_new)
content = content.replace("onClose={() => setActivePlayback(null)}\n          />\n        )}", "onClose={() => setActivePlayback(null)}\n          />\n        )}\n        </Suspense>")

open('src/App.tsx', 'w').write(content)
