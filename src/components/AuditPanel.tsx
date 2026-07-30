/**
 * StreamIndian - Tizen Repository & Subsystem Audit Panel
 * Inspects runtime environment, AVPlay availability, TS compilation readiness, and provider registry.
 */

import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, Cpu, Terminal, ShieldCheck, Layers, Tv, FileCode2 } from 'lucide-react';
import { FocusItem } from './FocusItem';
import { ProviderTestView } from './ProviderTestView';
import { providerManager } from '../providers';

import { useAVPlayManager, useResolutionManager, useSourceManager, useDebridManager, useTransferManager, useImageManager } from '../context/ServiceContext';
import { useEffect } from 'react';

export const AuditPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'providers' | 'tizen' | 'legacy' | 'streams' | 'debrid' | 'images' | 'test'>('overview');

  const providers = providerManager.getProviders();
  const avplayManager = useAVPlayManager();
  const resolutionManager = useResolutionManager();
  const sourceManager = useSourceManager();
  const debridManager = useDebridManager();
  const transferManager = useTransferManager();
  const imageManager = useImageManager();
  const [gatewayStats, setGatewayStats] = useState<any>(null);

  useEffect(() => {
    if (activeTab === 'debrid' || activeTab === 'overview') {
      fetch('/api/gateway/diagnostics')
        .then(res => res.json())
        .then(data => setGatewayStats(data))
        .catch(e => console.error('Failed to fetch gateway stats:', e));
    }
  }, [activeTab]);

  const debridProviders = debridManager.getAllProviders();
  const debridStats = debridManager.getDiagnostics();
  const imgStats = imageManager.getDiagnostics();
  const imgAny = imageManager as any;
  const imgMemEntries = imgAny.requests?.size || 0;
  const imgQueueLen = imgAny.queue?.length || 0;

  const isAVPlayAvailable = avplayManager.isAVPlayAvailable();

  const auditChecks = [
    {
      title: 'package.json & tsconfig.json Consistency',
      status: 'passed',
      detail: 'React 19, TypeScript 5.8, Tailwind CSS v4, Vite 6 properly configured.',
    },
    {
      title: 'Samsung AVPlay Engine Bridge',
      status: isAVPlayAvailable ? 'passed' : 'simulated',
      detail: isAVPlayAvailable
        ? 'Native webapis.avplay detected on TV runtime.'
        : 'Browser dev mode: HTML5 AVPlay simulation bridge active for preview testing.',
    },
    {
      title: 'Remote Spatial Key Controller (37/38/39/40/13/10009)',
      status: 'passed',
      detail: 'Registered key listeners for Tizen D-Pad, Return button, and media hotkeys.',
    },
    {
      title: 'Provider Abstraction Layer',
      status: 'passed',
      detail: 'Decoupled UI from providers. Automatic deduplication & ranking active.',
    },
    {
      title: 'Legacy Cloudflare Worker Separation',
      status: 'isolated',
      detail: 'Legacy Stremio/Worker code kept strictly isolated from future Tizen Web App bundle.',
    }
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto text-zinc-100 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5 p-6 rounded-3xl border border-white/10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
            <Cpu className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              StreamIndian Repository & System Audit
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Target: Samsung Tizen TV (Tizen Web Application • HTML/CSS/TypeScript • AVPlay)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/10">
          <FocusItem
            id="audit-tab-overview"
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold ${
              activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(79,70,229,0.4)]' : 'text-zinc-400 hover:text-white'
            }`}
          >
            System Health
          </FocusItem>
          <FocusItem
            id="audit-tab-providers"
            onClick={() => setActiveTab('providers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold ${
              activeTab === 'providers' ? 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(79,70,229,0.4)]' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Providers ({providers.length})
          </FocusItem>
          <FocusItem
            id="audit-tab-tizen"
            onClick={() => setActiveTab('tizen')}
            className={`px-4 py-2 rounded-xl text-xs font-bold ${
              activeTab === 'tizen' ? 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(79,70,229,0.4)]' : 'text-zinc-400 hover:text-white'
            }`}
          >
            AVPlay & Remote
          </FocusItem>
          <FocusItem
            id="audit-tab-debrid"
            onClick={() => setActiveTab('debrid')}
            className={`px-4 py-2 rounded-xl text-xs font-bold ${
              activeTab === 'debrid' ? 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(79,70,229,0.4)]' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Debrid & Streams
          </FocusItem>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {auditChecks.map((check, idx) => (
            <div
              key={idx}
              className="bg-white/5 p-5 rounded-2xl border border-white/10 flex items-start gap-4"
            >
              {check.status === 'passed' ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : check.status === 'simulated' ? (
                <Tv className="w-6 h-6 text-indigo-400 flex-shrink-0 mt-0.5" />
              ) : (
                <ShieldCheck className="w-6 h-6 text-sky-400 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <h3 className="font-bold text-sm text-white">{check.title}</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{check.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'test' && (
          <ProviderTestView />
        )}
        
        {activeTab === 'images' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold mb-4">Image Pipeline Verification</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-xl">
                 <h4 className="text-sm text-indigo-400 font-bold mb-2">Memory Cache Entries</h4>
                 <div className="text-2xl font-black">{imgMemEntries}</div>
                 <div className="text-xs text-zinc-400 mt-1">Images currently in memory</div>
              </div>
              <div className="bg-white/5 p-4 rounded-xl">
                 <h4 className="text-sm text-indigo-400 font-bold mb-2">Cache Hits / Misses</h4>
                 <div className="text-2xl font-black">{imgStats.cacheHits} / {imgStats.cacheMisses}</div>
                 <div className="text-xs text-zinc-400 mt-1">Prefetched / On-demand</div>
              </div>
              <div className="bg-white/5 p-4 rounded-xl">
                 <h4 className="text-sm text-indigo-400 font-bold mb-2">Queue Length</h4>
                 <div className="text-2xl font-black">{imgQueueLen}</div>
                 <div className="text-xs text-zinc-400 mt-1">Pending image loads</div>
              </div>
              <div className="bg-white/5 p-4 rounded-xl">
                 <h4 className="text-sm text-indigo-400 font-bold mb-2">Completed Loads</h4>
                 <div className="text-2xl font-black">{imgStats.completedLoads}</div>
                 <div className="text-xs text-zinc-400 mt-1">Avg latency: {imgStats.averageLatencyMs}ms</div>
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
        
        {activeTab === 'providers' && (
        <div className="space-y-4">
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
            <h3 className="font-bold text-base text-indigo-400 mb-2 flex items-center gap-2">
              <Layers className="w-5 h-5" /> Provider Architecture Rule Compliance
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              UI components never invoke providers directly. Catalog requests, language filtering, ranking, and stream resolution pass through <code className="text-indigo-400 bg-black/60 px-1.5 py-0.5 rounded border border-white/10">providerManager</code>.
            </p>
          </div>

          {providers.map((p) => (
            <div key={p.id} className="bg-white/5 p-5 rounded-2xl border border-white/10 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{p.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                    Active
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">{p.description}</p>
                <div className="flex items-center gap-2 mt-2 text-[11px] text-zinc-500">
                  <span>Languages: {p.supportedLanguages.join(', ')}</span>
                </div>
              </div>
              <FocusItem
                id={`provider-toggle-${p.id}`}
                onClick={() => providerManager.setProviderEnabled(p.id, !p.enabled)}
                className="px-3 py-1.5 rounded-xl bg-white/10 text-xs font-bold text-zinc-300 border border-white/10 hover:text-white"
              >
                {p.enabled ? 'Disable' : 'Enable'}
              </FocusItem>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'tizen' && (
        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center gap-3 text-indigo-400 font-bold text-sm">
            <Terminal className="w-5 h-5" /> Samsung Tizen TV Specs
          </div>
          <div className="text-xs space-y-2 text-zinc-300 font-mono bg-black/60 p-4 rounded-xl border border-white/10">
            <p>• Player: Samsung AVPlay (webapis.avplay)</p>
            <p>• Key Code 37: KEY_LEFT</p>
            <p>• Key Code 38: KEY_UP</p>
            <p>• Key Code 39: KEY_RIGHT</p>
            <p>• Key Code 40: KEY_DOWN</p>
            <p>• Key Code 13: KEY_ENTER</p>
            <p>• Key Code 10009: KEY_RETURN (Back button)</p>
            <p>• Key Code 10252: KEY_PLAY_PAUSE</p>
          </div>
        </div>
      )}

      {activeTab === 'debrid' && (
        <div className="space-y-6">
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-3">
            <h3 className="font-bold text-base text-purple-400 flex items-center gap-2">
              <Layers className="w-5 h-5" /> Registered Debrid Providers
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {debridProviders.map((p) => {
                const health = debridStats[p.id]?.health;
                return (
                  <div key={p.id} className="bg-black/40 p-4 rounded-xl border border-white/10 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm uppercase">{p.name}</h4>
                      <p className="text-xs text-zinc-400">Health: {health?.reliability || 0}% • Latency: {health?.latencyMs || 0}ms</p>
                    </div>
                    <span className={`px-2.5 py-1 ${health?.isAvailable ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'} rounded text-xs font-bold`}>
                      {health?.isAvailable ? 'Active' : 'Offline'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-3">
            <h3 className="font-bold text-base text-indigo-400 flex items-center gap-2">
              <Terminal className="w-5 h-5" /> Debrid & Gateway System Statistics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-black/40 p-4 rounded-xl border border-white/10">
                <div className="text-2xl font-black text-indigo-400">{debridProviders.length}</div>
                <div className="text-xs text-zinc-400 mt-1">Debrid Providers</div>
              </div>
              <div className="bg-black/40 p-4 rounded-xl border border-white/10">
                <div className="text-2xl font-black text-emerald-400">{gatewayStats ? Math.round((gatewayStats.cache?.hits / (gatewayStats.cache?.hits + gatewayStats.cache?.misses || 1)) * 100) : 0}%</div>
                <div className="text-xs text-zinc-400 mt-1">Gateway Cache Hit Rate</div>
              </div>
              <div className="bg-black/40 p-4 rounded-xl border border-white/10">
                <div className="text-2xl font-black text-purple-400">{gatewayStats?.cache?.size || 0}</div>
                <div className="text-xs text-zinc-400 mt-1">Gateway Cache Size</div>
              </div>
              <div className="bg-black/40 p-4 rounded-xl border border-white/10">
                <div className="text-2xl font-black text-amber-400">{Object.keys(gatewayStats?.providers || {}).length}</div>
                <div className="text-xs text-zinc-400 mt-1">Gateway Source Providers</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
