import { ISourceProvider, MediaSearchQuery, CanonicalStreamSource, ProviderHealth } from '../../types';
import { GatewayManager } from '../../gateway/GatewayManager';
import { DirectAddonTransport, ProxyAddonTransport, AddonTransport } from '../../gateway/AddonTransport';

export class GatewaySourceProvider implements ISourceProvider {
  public readonly id = 'gateway_provider';
  public readonly name = 'StreamIndian Gateway';
  public readonly priority: number;
  
  private isAvailable: boolean = true;
  private latencyMs: number = 0;
  private reliability: number = 100;
  private failureCount: number = 0;
  private averageSearchTimeMs: number = 0;
  
  private settingsManager: any;
  private gatewayManager: GatewayManager;

  constructor(settingsManager: any, transport?: AddonTransport, priority: number = 99) {
    this.settingsManager = settingsManager;
    this.priority = priority;
    
    // Explicit transport selection:
    // Production Tizen default is DirectAddonTransport.
    // Browser explicitly selects ProxyAddonTransport to bypass CORS.
    const isTizen = typeof window !== 'undefined' && (window as any).tizen !== undefined;
    const defaultTransport = !isTizen ? new ProxyAddonTransport() : new DirectAddonTransport();
    this.gatewayManager = new GatewayManager(transport || defaultTransport);
  }

  public async initialize(): Promise<void> {}

  public async healthCheck(): Promise<boolean> {
    return this.isAvailable;
  }

  public getHealth(): ProviderHealth {
    return {
      isAvailable: this.isAvailable,
      latencyMs: this.latencyMs,
      reliability: this.reliability,
      failureCount: this.failureCount,
      averageSearchTimeMs: this.averageSearchTimeMs
    };
  }

  public supports(query: MediaSearchQuery): boolean {
    return true; 
  }

  public async search(query: MediaSearchQuery): Promise<CanonicalStreamSource[]> {
    try {
      const start = Date.now();
      
      const tbKey = this.settingsManager?.getSettings?.()?.streams?.torboxApiKey;
      const addons = this.settingsManager?.getSettings?.()?.streams?.stremioAddons || [];
      
      
      const tbConfigured = !!tbKey;
      let addonDetails = addons.map(a => {
        try {
            let u = new URL(a);
            let hasConfig = u.pathname.replace('/manifest.json', '').length > 1;
            return { hostname: u.hostname, configPresent: hasConfig };
        } catch(e) { return { hostname: 'invalid', configPresent: false }; }
      });
      
      const debridPref = this.settingsManager?.getSettings?.()?.streams?.preferredDebridProvider || 'torbox';

      console.log('RUNTIME_STREAM_CONFIG');
      console.log('addon count:', addons.length);
      console.log('addon hosts:', addonDetails.map(a => a.hostname).join(', '));
      console.log('configuration path present for each addon:', addonDetails.map(a => a.configPresent).join(', '));
      console.log('preferred debrid:', debridPref);
      console.log('TorBox key present:', tbConfigured);
      console.log('Browser transport:', this.gatewayManager.transport ? this.gatewayManager.transport.constructor.name : 'unknown');
      console.log('STREAM DIAGNOSTIC');
      console.log('-----------------');
      console.log('media title:', query.title);
      console.log('media type:', query.type);
      console.log('internal id:', query.mediaId);
      console.log('tmdb id:', query.tmdbId);
      console.log('imdb id:', query.imdbId);
      console.log('season:', query.season);
      console.log('episode:', query.episode);
      console.log('configured addon count:', addons.length);
      for (const ad of addonDetails) {
          console.log(`  hostname: ${ad.hostname}`);
          console.log(`  configuration path present: ${ad.configPresent ? 'yes' : 'no'}`);
      }
      console.log('TorBox configured:', tbConfigured ? 'yes' : 'no');
      console.log('preferred debrid:', debridPref);
      
      const data = await this.gatewayManager.search(query, { torboxKey: tbKey, addons });
      
      console.log(`TRACE_COUNT GatewaySourceProvider: ${data.length}`);

      this.latencyMs = Date.now() - start;
      if (this.averageSearchTimeMs === 0) {
        this.averageSearchTimeMs = this.latencyMs;
      } else {
        this.averageSearchTimeMs = (this.averageSearchTimeMs + this.latencyMs) / 2;
      }
      
      return data;
    } catch (e: any) {
      console.error('[GatewaySourceProvider] Search failed:', e);
      this.failureCount++;
      return [];
    }
  }
}
