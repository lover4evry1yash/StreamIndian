import re

# Add diagnostics to TVDBClient
client_content = open('src/core/providers/tvdb/TVDBClient.ts').read()

state_add = """  private lastRequestTime: number = 0;
  
  // Diagnostics
  public metrics = {
    requests: 0,
    rateLimitsHit: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalLatencyMs: 0
  };"""

client_content = client_content.replace("  private lastRequestTime: number = 0;", state_add)

fetch_update_old = """    try {
      const result = await this.network.getJson<any>(`${BASE_URL}${path}`, {"""
fetch_update_new = """    try {
      this.metrics.requests++;
      const start = Date.now();
      const result = await this.network.getJson<any>(`${BASE_URL}${path}`, {"""
client_content = client_content.replace(fetch_update_old, fetch_update_new)

fetch_ret_old = """      });
      return result.data as T;"""
fetch_ret_new = """      });
      this.metrics.totalLatencyMs += (Date.now() - start);
      return result.data as T;"""
client_content = client_content.replace(fetch_ret_old, fetch_ret_new)

rate_limit_old = """      if (error.message && error.message.includes('429') && retries > 0) { // Rate limit
        this.logger.warn(`TVDB Rate Limit hit. Retrying...`);"""
rate_limit_new = """      if (error.message && error.message.includes('429') && retries > 0) { // Rate limit
        this.metrics.rateLimitsHit++;
        this.logger.warn(`TVDB Rate Limit hit. Retrying...`);"""
client_content = client_content.replace(rate_limit_old, rate_limit_new)

# Update cache hits
client_content = client_content.replace("if (cached) return cached;", "if (cached) {\n      this.metrics.cacheHits++;\n      return cached;\n    }\n    this.metrics.cacheMisses++;")

open('src/core/providers/tvdb/TVDBClient.ts', 'w').write(client_content)


provider_content = open('src/core/providers/tvdb/TVDBProvider.ts').read()

diag_method = """
  public getDiagnostics() {
    if (!this.client) return null;
    const m = this.client.metrics;
    return {
      availability: this.isInitialized ? 'ONLINE' : 'OFFLINE',
      averageLatencyMs: m.requests > 0 ? Math.round(m.totalLatencyMs / m.requests) : 0,
      rateLimitsHit: m.rateLimitsHit,
      cacheHitRate: (m.cacheHits + m.cacheMisses) > 0 ? (m.cacheHits / (m.cacheHits + m.cacheMisses)) : 0,
      cacheHits: m.cacheHits,
      cacheMisses: m.cacheMisses
    };
  }
}
"""
provider_content = provider_content.replace("}\n", diag_method)
open('src/core/providers/tvdb/TVDBProvider.ts', 'w').write(provider_content)
