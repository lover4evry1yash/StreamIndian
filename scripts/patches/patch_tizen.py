content = open('src/types/tizen.ts').read()

import re

new_readiness = """
export enum PlaybackReadiness {
  DIRECT = 'DIRECT',
  DEBRID_CACHED = 'DEBRID_CACHED',
  DEBRID_REQUIRED = 'DEBRID_REQUIRED',
  DIRECT_TORRENT = 'DIRECT_TORRENT',
  PARTIALLY_CACHED = 'PARTIALLY_CACHED',
  MULTI_PROVIDER_CACHED = 'MULTI_PROVIDER_CACHED',
  UNAVAILABLE = 'UNAVAILABLE'
}

export interface StreamPresentationModel {
  id: string;
  title: string;
  quality: string;
  format: string;
  codec?: string;
  audio?: string;
  hdr?: boolean;
  dolbyVision?: boolean;
  atmos?: boolean;
  bitrate?: number;
  size?: number;
  seeders?: number;
  readiness: PlaybackReadiness;
  score?: number;
  providerName: string;
  cacheMatrix: Record<string, boolean>; // e.g. { "torbox": true, "realdebrid": false }
  preferredDebrid?: string;
  isLegalPublicStream: boolean;
  streamSource: any; // Opaque reference back to the original source to avoid leaking provider specifics
}
"""

content = re.sub(r"export enum PlaybackReadiness \{.*?\n\}", new_readiness.strip(), content, flags=re.DOTALL)

open('src/types/tizen.ts', 'w').write(content)
