import { CanonicalStreamSource, MediaSearchQuery } from '../types';
import { AddonConfig } from './ProviderRegistry';
import { StremioParser } from './StremioParser';
import { IProviderClient, ProviderCapabilities, ProviderMetadata, ProviderMetrics } from './IProviderClient';
import { CircuitBreaker, CircuitState } from './CircuitBreaker';

export class AddonClient implements IProviderClient {
    private config: AddonConfig;
    private circuitBreaker: CircuitBreaker;
    private metrics: ProviderMetrics = {
        latencyMs: 0,
        successRate: 1,
        consecutiveFailures: 0,
        circuitState: CircuitState.CLOSED,
        dynamicScore: 0,
        totalRequests: 0,
        successfulRequests: 0,
        totalRetries: 0
    };

    constructor(config: AddonConfig) {
        this.config = config;
        this.circuitBreaker = new CircuitBreaker(
            config.failureThreshold || 3, 
            config.cooldownMs || 10 * 60 * 1000
        ); // Default 3 failures, 10 min cooldown
    }

    public getBaseUrl(): string {
        return this.config.baseUrl;
    }

    public getMetadata(): ProviderMetadata {
        return {
            id: this.config.id,
            name: this.config.name,
            priority: this.config.priority
        };
    }

    public getCapabilities(): ProviderCapabilities {
        return this.config.capabilities || {
            movies: true,
            episodes: true
        };
    }

    public getMetrics(): ProviderMetrics {
        this.metrics.circuitState = this.circuitBreaker.getState();
        if (!this.config.enabled) {
            this.metrics.disabledReason = 'Manually disabled';
        } else if (this.metrics.circuitState === CircuitState.OPEN) {
            this.metrics.disabledReason = 'Circuit breaker open';
        } else {
            this.metrics.disabledReason = undefined;
        }
        return { ...this.metrics };
    }

    public async healthCheck(): Promise<boolean> {
        return this.config.enabled && this.circuitBreaker.getState() !== CircuitState.OPEN;
    }

    private updateMetrics(latency: number, success: boolean, error?: Error) {
        this.metrics.totalRequests++;
        if (success) {
            this.metrics.successfulRequests++;
            this.metrics.consecutiveFailures = 0;
            this.metrics.lastSuccessfulRequest = Date.now();
            // Moving average for latency
            this.metrics.latencyMs = this.metrics.latencyMs === 0 ? latency : (this.metrics.latencyMs * 0.8) + (latency * 0.2);
        } else {
            this.metrics.consecutiveFailures++;
            this.metrics.lastError = error?.message;
        }

        this.metrics.successRate = this.metrics.successfulRequests / this.metrics.totalRequests;
        this.metrics.circuitState = this.circuitBreaker.getState();

        // Score = (Base Priority * 100) + (Success Rate * 50) - (Avg Latency in Seconds * 10)
        // Adjust score based on capability matching if possible, but here we just do basic score
        this.metrics.dynamicScore = (this.config.priority * 100) + (this.metrics.successRate * 50) - ((this.metrics.latencyMs / 1000) * 10);
    }

    public async search(query: MediaSearchQuery, context?: { torboxKey?: string, addons?: string[] }, retries?: number): Promise<CanonicalStreamSource[]> {
        if (!this.config.enabled) return [];
        
        const currentRetries = retries !== undefined ? retries : (this.config.retries ?? 1);
        
        try {
            return await this.circuitBreaker.execute(async () => {
                const startTime = Date.now();
                const type = query.type === 'episode' ? 'series' : 'movie';
                if (!query.imdbId && !query.tmdbId) {
                    console.error('[AddonClient] INVALID_MEDIA_ID: Both imdbId and tmdbId are missing.');
                    throw new Error('INVALID_MEDIA_ID');
                }
                let idStr = query.imdbId ? query.imdbId : `tmdb:${query.tmdbId}`;

                if (query.type === 'episode') {
                    idStr = `${idStr}:${query.season || 1}:${query.episode || 1}`;
                }

               
                // DIAGNOSTICS LOGGING
                const u = new URL(this.config.baseUrl);
                const hasConfig = u.pathname.replace('/manifest.json', '').length > 1;
                const stateBefore = this.circuitBreaker.getState();
                
                // REDACT SENSITIVE PATHS
                let safeBasePath = u.pathname;
                if (hasConfig) {
                    safeBasePath = '/[REDACTED_CONFIG]';
                }
                const safeBaseUrl = u.protocol + '//' + u.hostname + safeBasePath;
                const safeEndpoint = safeBaseUrl + `/stream/${type}/${idStr}.json`;
                
                console.log(`[AddonClient:DIAG]
  addon opaque ID: ${this.config.id}
  hostname: ${u.hostname}
  configuration path exists: ${hasConfig ? 'yes' : 'no'}
  base path shape: ${safeBaseUrl}
  final pathname: ${safeEndpoint}
  transport: ${this.config.transport ? (this.config.transport.constructor.name) : 'fetch'}
  requested media type: ${query.type}
  stremio requested type: ${type}
  identifier: ${idStr.startsWith('tt') ? 'IMDb' : 'TMDB'} (${idStr})
  circuit breaker state BEFORE: ${stateBefore}`);

                const endpoint = `${this.config.baseUrl}/stream/${type}/${idStr}.json`;

                
                try {
                    console.log(`[AddonClient] ${this.config.id || this.config.name} Fetching stream data...`);
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout || 8000);

                    const fetchOptions = {
                        headers: this.config.headers || {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                            'Accept': 'application/json'
                        },
                        signal: controller.signal
                    };

                    const response = this.config.transport
                        ? await this.config.transport.request(endpoint, fetchOptions)
                        : await fetch(endpoint, fetchOptions);

                    clearTimeout(timeoutId);

                    console.log(`[AddonClient:DIAG] HTTP Status: ${response.status}`);

                    if (!response.ok) {
                        if (response.status === 403 || response.status === 429) {
                            this.circuitBreaker.trip();
                            throw new Error(`PROVIDER_403_BLOCKED: ${response.status}`);
                        }
                        if (response.status === 404) throw new Error('PROVIDER_404_NOT_FOUND');
    throw new Error(`PROVIDER_ERROR: ${response.status}`);
                    }

                    const data = await response.json();
                    const sources: CanonicalStreamSource[] = [];

                    const rawCount = (data && Array.isArray(data.streams)) ? data.streams.length : 0;
                    console.log(`[AddonClient] ${this.config.id || this.config.name} Raw data.streams.length: ${rawCount}`);

                    if (data && Array.isArray(data.streams)) {
                        for (const stream of data.streams) {
                            let parsed = null;
                            if (this.config.parser) {
                                parsed = this.config.parser(stream, query);
                            } else {
                                parsed = StremioParser.parse(stream, query, this.config.name);
                            }
                            if (parsed) {
                                sources.push(parsed);
                            }
                        }
                    }

                    this.updateMetrics(Date.now() - startTime, true);
    console.log(`[AddonClient:DIAG] circuit state after: ${this.circuitBreaker.getState()}`);
    console.log(`[AddonClient:DIAG] circuit breaker state AFTER: ${this.circuitBreaker.getState()}`);
                    console.log(`[AddonClient] ${this.config.id || this.config.name} Parsed sources.length: ${sources.length}`);
                    console.log(`TRACE_COUNT AddonClient[${this.config.id || this.config.name}]: ${sources.length}`);
                    return sources;
                } catch (error: any) {
                    console.log(`[AddonClient] ${this.config.id || this.config.name} Error: ${error.message}`);
                    if (currentRetries > 0 && (error as Error).name !== 'AbortError' && !(error as Error).message?.startsWith('Blocked')) {
                        this.metrics.totalRetries++;
                        await new Promise(r => setTimeout(r, 1000)); // Exponential backoff in real implementation, but static here
                        return this.search(query, context, currentRetries - 1);
                    }
                    this.updateMetrics(Date.now() - startTime, false, error as Error);
                    console.log(`[AddonClient:DIAG] circuit breaker state AFTER: ${this.circuitBreaker.getState()}`);
    console.log(`[AddonClient:DIAG] failure classification: ${error.message}`);
    console.log(`[AddonClient:DIAG] failure classification: ${error.message}`);
    console.log(`[AddonClient:DIAG] circuit state after: ${this.circuitBreaker.getState()}`);
    throw error;
                }
            });
        } catch (error: any) {
            if (error.message?.includes('Blocked')) {
                console.log(`[AddonClient:${this.config.id}] Search unavailable: ${error.message}`);
            } else {
                console.log(`[AddonClient:${this.config.id}] Search unsuccessful: ${error.message}`);
            }
            return [];
        }
    }
}
