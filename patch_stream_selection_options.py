content = open('src/components/StreamSelectionView.tsx').read()

import re

# Import SettingsManager
content = content.replace("import { container } from '../core/ServiceContainer';", "import { container } from '../core/ServiceContainer';\nimport { SettingsManager } from '../core/storage';")

# Resolve SettingsManager
content = content.replace("const resolutionManager = container.resolve<ResolutionManager>('ResolutionManager');", "const resolutionManager = container.resolve<ResolutionManager>('ResolutionManager');\n  const settingsManager = container.resolve<SettingsManager>('SettingsManager');\n  const settings = settingsManager.getSettings();")

# Pass options to resolve
content = content.replace("const resolved = await resolutionManager.resolve(discovered, { mode: 'best' });", "const resolved = await resolutionManager.resolve(discovered, { \n          mode: settings.streams?.sortMode || 'best', \n          preferredLanguage: settings.playback?.defaultAudioLanguage || undefined \n        });")

open('src/components/StreamSelectionView.tsx', 'w').write(content)
