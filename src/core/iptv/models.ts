export interface IptvPlaylist {
  id: string;
  name: string;
  url?: string; // M3U URL or Xtream Base URL
  type: 'm3u' | 'xtream';
  username?: string;
  password?: string;
  autoUpdate: boolean;
  lastUpdated: number;
  refreshFailures?: number;
  channelCount?: number;
  epgUrl?: string;
}

export interface IptvChannel {
  id: string;
  playlistId: string;
  name: string;
  streamUrl: string;
  logoUrl?: string;
  group: string;
  tvgId?: string;
  tvgName?: string;
  streamId?: number;
  isFavorite: boolean;
  isHidden: boolean;
  catchupDays?: number;
  catchupSource?: string;
}

export interface IptvProgram {
  id: string;
  playlistId: string;
  tvgId: string; // The ID used in the XMLTV to link to the channel
  title: string;
  description?: string;
  startTime: number;
  endTime: number;
}


export interface IptvDiagnostics {
  playlistId: string;
  isValid: boolean;
  channelCount: number;
  epgStatus: string;
  lastRefresh: number;
  refreshFailures: number;
}
