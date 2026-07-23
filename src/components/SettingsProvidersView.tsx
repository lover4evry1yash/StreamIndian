import React, { useState } from 'react';
import { FocusItem } from './FocusItem';
import { useSettingsManager, useEventBus } from '../context/ServiceContext';
import { Save, CheckCircle, AlertTriangle } from 'lucide-react';

const PROVIDERS = [
  { id: 'tmdb', name: 'TMDB', fields: ['apiKey'] },
  { id: 'fanart', name: 'Fanart.tv', fields: ['apiKey'] },
  { id: 'trakt', name: 'Trakt', fields: ['clientId', 'clientSecret'] },
  { id: 'mdblist', name: 'MDBList', fields: ['apiKey'] },
  { id: 'torbox', name: 'Torbox', fields: ['apiKey'] },
  { id: 'rpdb', name: 'RPDB', fields: ['apiKey'] },
  { id: 'tvdb', name: 'TVDB', fields: ['apiKey', 'clientId'] },
  { id: 'anilist', name: 'AniList', fields: ['apiKey'] }
];

export const SettingsProvidersView: React.FC = () => {
  const settingsManager = useSettingsManager();
  const eventBus = useEventBus();
  const [settings, setSettings] = useState(settingsManager?.getSettings());
  const [selectedProvider, setSelectedProvider] = useState(PROVIDERS[0]);
  const [formValues, setFormValues] = useState<any>({});
  
  React.useEffect(() => {
    if (settings && settings.providers && settings.providers[selectedProvider.id]) {
       setFormValues(settings.providers[selectedProvider.id]);
    } else {
       setFormValues({ enabled: true });
    }
  }, [selectedProvider, settings]);

  if (!settings) return null;

  const handleSave = async () => {
    if (!settingsManager) return;
    const newProviders = { ...(settings.providers || {}) };
    newProviders[selectedProvider.id] = formValues;
    await settingsManager.updateSettings({ providers: newProviders });
    setSettings(settingsManager.getSettings());
    // Also update stream settings for torbox
    if (selectedProvider.id === 'torbox' && formValues.apiKey) {
       await settingsManager.updateSettings({ 
         streams: { ...settings.streams, torboxApiKey: formValues.apiKey }
       });
    }
  };

  const handleTest = () => {
    // Implement provider test logic here if needed
    alert('Test functionality to be implemented in Diagnostics/Provider Test screen.');
  };

  return (
    <div className="flex gap-6 h-[400px]">
      <div className="w-1/3 space-y-2 border-r border-white/10 pr-4">
        {PROVIDERS.map(p => {
           const provSettings = settings.providers?.[p.id] || {};
           const hasKey = !!provSettings.apiKey || !!provSettings.clientId;
           return (
             <FocusItem
                key={`prov-${p.id}`}
                id={`prov-${p.id}`}
                onClick={() => setSelectedProvider(p)}
                className={`p-3 rounded-xl flex items-center justify-between transition-all ${selectedProvider.id === p.id ? 'bg-indigo-600 text-white' : 'bg-white/5 hover:bg-white/10'}`}
             >
                <span className="font-bold">{p.name}</span>
                {hasKey ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-amber-400" />}
             </FocusItem>
           );
        })}
      </div>
      <div className="w-2/3 p-4 bg-white/5 rounded-2xl border border-white/10">
         <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">{selectedProvider.name} Configuration</h3>
            <FocusItem
              id="prov-toggle"
              onClick={() => setFormValues({...formValues, enabled: !formValues.enabled})}
              className={`px-3 py-1 rounded-full text-xs font-bold ${formValues.enabled ? 'bg-emerald-500' : 'bg-zinc-600'}`}
            >
              {formValues.enabled ? 'ENABLED' : 'DISABLED'}
            </FocusItem>
         </div>
         <div className="space-y-4">
            {selectedProvider.fields.map(field => (
               <div key={field} className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-400 uppercase tracking-wider">{field}</label>
                  <input
                     type="text"
                     value={formValues[field] || ''}
                     onChange={(e) => setFormValues({...formValues, [field]: e.target.value})}
                     className="bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                     placeholder={`Enter ${field}...`}
                  />
               </div>
            ))}
         </div>
         <div className="mt-8 flex gap-4">
            <FocusItem
              id="prov-test"
              onClick={handleTest}
              className="px-4 py-2 bg-white/10 rounded-xl text-sm font-bold text-white hover:bg-white/20"
            >
              Test Connection
            </FocusItem>
            <FocusItem
              id="prov-save"
              onClick={handleSave}
              className="px-4 py-2 bg-indigo-600 rounded-xl text-sm font-bold text-white flex items-center gap-2 hover:bg-indigo-500"
            >
              <Save className="w-4 h-4" /> Save Configuration
            </FocusItem>
         </div>
      </div>
    </div>
  );
};
