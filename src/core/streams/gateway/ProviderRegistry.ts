import { CanonicalStreamSource, MediaSearchQuery } from '../types';
import { IProviderClient, ProviderMetrics, ProviderCapabilities } from './IProviderClient';
import { AddonClient } from './AddonClient';
import { StremioParser } from './StremioParser';
import { AddonTransport } from './AddonTransport';

export interface AddonConfig {
    id: string;
    name: string;
    baseUrl: string;
    enabled: boolean;
    priority: number;
    timeout?: number;
    retries?: number;
    cooldownMs?: number;
    failureThreshold?: number;
    headers?: Record<string, string>;
    capabilities?: ProviderCapabilities;
    parser?: (stream: any, query: MediaSearchQuery) => CanonicalStreamSource | null;
    transport?: AddonTransport;
}

export class ProviderRegistry {
    private providers: Map<string, IProviderClient> = new Map();

    constructor() {
        // No hardcoded default addons per user requirements.
        // Users must configure their own addons.
    }

    public register(client: IProviderClient) {
        this.providers.set(client.getMetadata().id, client);
    }

    public unregister(id: string) {
        this.providers.delete(id);
    }
    
    public has(id: string): boolean {
        return this.providers.has(id);
    }
    
    public get(id: string): IProviderClient | undefined {
        return this.providers.get(id);
    }

    public getCapableProviders(query: MediaSearchQuery): IProviderClient[] {
        const capable: IProviderClient[] = [];
        for (const provider of this.providers.values()) {
            const caps = provider.getCapabilities();
            if (query.type === 'movie' && caps.movies) capable.push(provider);
            else if (query.type === 'episode' && caps.episodes) capable.push(provider);
        }
        return capable;
    }

    public loadFromConfiguration(configs: AddonConfig[]) {
        for (const config of configs) {
            if (config.enabled) {
                this.register(new AddonClient(config));
            }
        }
    }

    public getDiagnostics(): Record<string, ProviderMetrics & { capabilities: import('./IProviderClient').ProviderCapabilities }> {
        const metrics: Record<string, ProviderMetrics & { capabilities: import('./IProviderClient').ProviderCapabilities }> = {};
        for (const [id, provider] of this.providers.entries()) {
            metrics[id] = {
                ...provider.getMetrics(),
                capabilities: provider.getCapabilities()
            };
        }
        return metrics;
    }
}
