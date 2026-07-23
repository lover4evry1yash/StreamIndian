import os

providers_dir = "src/core/streams/sources/providers"
os.makedirs(providers_dir, exist_ok=True)

# Helper template
template = """import { ISourceProvider, MediaSearchQuery, CanonicalStreamSource, ProviderHealth } from '../../types';

export class $NAME implements ISourceProvider {
  public readonly id = '$ID';
  public readonly name = '$NAME';
  public readonly priority: number;

  private isAvailable: boolean = true;
  private latencyMs: number = 0;
  private reliability: number = 100;
  private failureCount: number = 0;
  private averageSearchTimeMs: number = 0;

  constructor(priority: number = 50) {
    this.priority = priority;
  }

  public async initialize(): Promise<void> {
    // Initialization
  }

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
    return true; // Configured per provider
  }

  public async search(query: MediaSearchQuery): Promise<CanonicalStreamSource[]> {
    return [];
  }
}
"""

providers = [
    ("DirectHttpProvider", "direct_http"),
    ("HlsProvider", "hls"),
    ("DashProvider", "dash"),
    ("TorrentSourceProvider", "torrent_source"),
    ("StremioProvider", "stremio")
]

for name, pid in providers:
    content = template.replace("$NAME", name).replace("$ID", pid)
    with open(f"{providers_dir}/{name}.ts", "w") as f:
        f.write(content)

