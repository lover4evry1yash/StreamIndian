const fs = require('fs');

let types = fs.readFileSync('src/core/providers/types.ts', 'utf8');
types = types.replace(/export interface ProviderContext \{/,
`import { SettingsManager } from '../storage/SettingsManager';
export interface ProviderContext {
  settingsManager: SettingsManager;`);
fs.writeFileSync('src/core/providers/types.ts', types);

let mgr = fs.readFileSync('src/core/providers/ProviderManager.ts', 'utf8');
mgr = mgr.replace(/import \{ ProviderContext/g, "import { SettingsManager } from '../storage/SettingsManager';\nimport { ProviderContext");
mgr = mgr.replace(/private context: Omit<ProviderContext, 'logger'>;/, 
`private context: Omit<ProviderContext, 'logger'>;`);

let boot = fs.readFileSync('src/core/Bootstrap.ts', 'utf8');
boot = boot.replace(/const providerContext: Omit<ProviderContext, 'logger'> = \{/,
`const providerContext: Omit<ProviderContext, 'logger'> = {
        settingsManager,`);
fs.writeFileSync('src/core/Bootstrap.ts', boot);

console.log('Fixed context');
