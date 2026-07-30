import { CanonicalStreamSource, MediaSearchQuery } from '../types';
import { CircuitState } from './CircuitBreaker';

export interface ProviderCapabilities {
    movies: boolean;
    episodes: boolean;
    anime?: boolean;
    live?: boolean;
    uhd4k?: boolean;
}

export interface ProviderMetadata {
    id: string;
    name: string;
    priority: number;
}

export interface ProviderMetrics {
    latencyMs: number;
    successRate: number;
    consecutiveFailures: number;
    circuitState: CircuitState;
    dynamicScore: number;
    lastError?: string;
    totalRequests: number;
    successfulRequests: number;
    lastSuccessfulRequest?: number;
    disabledReason?: string;
    totalRetries: number;
}

export interface IProviderClient {
    search(query: MediaSearchQuery, context?: { torboxKey?: string, addons?: string[] }): Promise<CanonicalStreamSource[]>;
    healthCheck(): Promise<boolean>;
    getMetadata(): ProviderMetadata;
    getCapabilities(): ProviderCapabilities;
    getMetrics(): ProviderMetrics;
}
