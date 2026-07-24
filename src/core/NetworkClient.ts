import { Logger } from './Logger';

export interface FetchOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
  providerId?: string;
}

export interface NetworkDiagnostics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  timeouts: number;
  retries: number;
  cacheHits: number;
}

export interface ProviderLimits {
  requestsPerSecond: number;
  burstLimit: number;
}

export class NetworkClient {
  private logger: Logger;
  private deduplicationMap = new Map<string, Promise<Response>>();
  private diagnostics = new Map<string, NetworkDiagnostics>();
  private providerLimits = new Map<string, ProviderLimits>();
  
  // For rate limiting
  private tokenBuckets = new Map<string, { tokens: number; lastRefill: number }>();
  private requestQueue = new Map<string, Array<() => void>>();

  constructor(logger: Logger) {
    this.logger = logger;
    
    // Default provider limits can be added here or configured externally
    this.setProviderLimits('tmdb', { requestsPerSecond: 4, burstLimit: 10 });
    this.setProviderLimits('tvdb', { requestsPerSecond: 2, burstLimit: 5 });
    this.setProviderLimits('fanart', { requestsPerSecond: 2, burstLimit: 5 });
    this.setProviderLimits('mdblist', { requestsPerSecond: 2, burstLimit: 5 });
    this.setProviderLimits('trakt', { requestsPerSecond: 2, burstLimit: 5 });
  }
  
  public withProvider(providerId: string): NetworkClient {
    return new ScopedNetworkClient(this, providerId);
  }

  public setProviderLimits(providerId: string, limits: ProviderLimits) {
    this.providerLimits.set(providerId, limits);
    this.tokenBuckets.set(providerId, { tokens: limits.burstLimit, lastRefill: Date.now() });
    if (!this.requestQueue.has(providerId)) {
      this.requestQueue.set(providerId, []);
    }
  }

  public getDiagnostics(providerId: string): NetworkDiagnostics {
    if (!this.diagnostics.has(providerId)) {
      this.diagnostics.set(providerId, {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageLatency: 0,
        timeouts: 0,
        retries: 0,
        cacheHits: 0
      });
    }
    return this.diagnostics.get(providerId)!;
  }

  private updateDiagnostics(providerId: string, update: Partial<NetworkDiagnostics>) {
    const diag = this.getDiagnostics(providerId);
    if (update.totalRequests) diag.totalRequests += update.totalRequests;
    if (update.successfulRequests) diag.successfulRequests += update.successfulRequests;
    if (update.failedRequests) diag.failedRequests += update.failedRequests;
    if (update.timeouts) diag.timeouts += update.timeouts;
    if (update.retries) diag.retries += update.retries;
    if (update.cacheHits) diag.cacheHits += update.cacheHits;
    if (update.averageLatency !== undefined) {
      if (diag.averageLatency === 0) {
        diag.averageLatency = update.averageLatency;
      } else {
        // EMA calculation
        diag.averageLatency = (diag.averageLatency * 0.9) + (update.averageLatency * 0.1);
      }
    }
  }

  private async waitForTokens(providerId: string): Promise<void> {
    const limits = this.providerLimits.get(providerId);
    if (!limits) return; // No limits set for provider

    const bucket = this.tokenBuckets.get(providerId)!;
    const queue = this.requestQueue.get(providerId)!;

    return new Promise<void>((resolve) => {
      const tryConsume = () => {
        const now = Date.now();
        const timePassed = now - bucket.lastRefill;
        const tokensToAdd = timePassed * (limits.requestsPerSecond / 1000);
        
        if (tokensToAdd > 0) {
          bucket.tokens = Math.min(limits.burstLimit, bucket.tokens + tokensToAdd);
          bucket.lastRefill = now;
        }

        if (bucket.tokens >= 1) {
          bucket.tokens -= 1;
          resolve();
        } else {
          // Wait and try again
          const timeToWait = (1 - bucket.tokens) / (limits.requestsPerSecond / 1000);
          setTimeout(tryConsume, Math.max(10, timeToWait));
        }
      };

      if (queue.length === 0 && bucket.tokens >= 1) {
        // Fast path
        bucket.tokens -= 1;
        bucket.lastRefill = Date.now();
        resolve();
      } else {
        queue.push(tryConsume);
        this.processQueue(providerId);
      }
    });
  }

  private processQueue(providerId: string) {
    const queue = this.requestQueue.get(providerId)!;
    if (queue.length > 0) {
      const next = queue.shift();
      if (next) next();
    }
  }

  public async fetch(url: string, options: FetchOptions = {}): Promise<Response> {
    const { timeoutMs = 15000, retries = 3, providerId = 'unknown', ...fetchOptions } = options;
    
    // Deduplication Key
    const dedupKey = `${url}_${fetchOptions.method || 'GET'}_${JSON.stringify(fetchOptions.body || '')}`;
    
    if (this.deduplicationMap.has(dedupKey)) {
      if (providerId !== 'unknown') this.updateDiagnostics(providerId, { cacheHits: 1 });
      const res = await this.deduplicationMap.get(dedupKey)!;
      // We must clone the response because body stream can only be read once
      return res.clone();
    }

    const fetchPromise = this.executeFetchWithRetries(url, { ...options, providerId, timeoutMs, retries, ...fetchOptions });
    
    this.deduplicationMap.set(dedupKey, fetchPromise);
    
    try {
      const response = await fetchPromise;
      return response.clone();
    } finally {
      this.deduplicationMap.delete(dedupKey);
    }
  }

  private async executeFetchWithRetries(url: string, options: FetchOptions): Promise<Response> {
    const { timeoutMs, retries = 3, providerId = 'unknown', ...fetchOptions } = options;
    
    let attempt = 0;
    
    if (providerId !== 'unknown') this.updateDiagnostics(providerId, { totalRequests: 1 });

    while (attempt <= retries) {
      if (providerId !== 'unknown') await this.waitForTokens(providerId);

      const start = Date.now();
      try {
        const controller = new AbortController();
        
        let timeoutId: any;
        if (timeoutMs) {
            timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        }
        
        // Link to provided signal if exists
        if (fetchOptions.signal) {
            fetchOptions.signal.addEventListener('abort', () => controller.abort());
        }

        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
        });
        
        if (timeoutId) clearTimeout(timeoutId);
        const durationMs = Date.now() - start;

        if (!response.ok) {
          const cleanUrl = url.replace(/([?&](?:api_key|apikey|token|auth_token)=)[^&]+/gi, '$1***');
          this.logger.debug(`Fetch failed for ${cleanUrl} with status ${response.status}`);
          // Retry on 429, 500, 502, 503, 504
          const isRetryable = response.status === 429 || response.status >= 500;
          
          if (!isRetryable) {
             const error: any = new Error(`HTTP Error: ${response.status}`);
             error.isPermanent = true;
             throw error;
          }
          // Retryable error will throw and be caught below
          throw new Error(`HTTP Error Retryable: ${response.status}`);
        }
        
        if (providerId !== 'unknown') {
            this.updateDiagnostics(providerId, { successfulRequests: 1, averageLatency: durationMs });
        }
        return response;
      } catch (error: any) {
        const durationMs = Date.now() - start;
        const isTimeout = error.name === 'AbortError' || error.message.includes('Timeout');
        
        if (providerId !== 'unknown') {
            if (isTimeout) this.updateDiagnostics(providerId, { timeouts: 1 });
            this.updateDiagnostics(providerId, { averageLatency: durationMs });
        }
        
        const cleanUrl = url.replace(/([?&](?:api_key|apikey|token|auth_token)=)[^&]+/gi, '$1***');
        this.logger.debug(`Attempt ${attempt + 1} failed for ${cleanUrl}: ${error.message}`);
        
        if (attempt === retries || error.isPermanent) {
          if (providerId !== 'unknown') this.updateDiagnostics(providerId, { failedRequests: 1 });
          throw error;
        }
        
        if (providerId !== 'unknown') this.updateDiagnostics(providerId, { retries: 1 });
      }
      
      attempt++;
      // Exponential backoff with jitter
      const baseWait = Math.pow(2, attempt) * 500;
      const jitter = Math.random() * 200;
      await this.sleep(baseWait + jitter);
    }
    
    throw new Error(`Failed to fetch ${url} after ${retries} retries`);
  }

  public async getJson<T>(url: string, options?: FetchOptions): Promise<T> {
    const response = await this.fetch(url, options);
    return response.json();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

class ScopedNetworkClient extends NetworkClient {
    constructor(private parent: NetworkClient, private providerId: string) {
        super(parent['logger']); 
    }
    
    public fetch(url: string, options: FetchOptions = {}): Promise<Response> {
        return this.parent.fetch(url, { ...options, providerId: this.providerId });
    }
    
    public getJson<T>(url: string, options: FetchOptions = {}): Promise<T> {
        return this.parent.getJson<T>(url, { ...options, providerId: this.providerId });
    }
}
