import { StreamSource, MediaItem } from '../../types/tizen';
import { PlaybackState } from './types';

export class PlaybackSession {
  public readonly media: MediaItem;
  public readonly stream: StreamSource;
  
  public state: PlaybackState = PlaybackState.IDLE;
  public currentTime: number = 0;
  public duration: number = 0;
  public selectedAudioTrack: number | null = null;
  public selectedSubtitleTrack: number | null = null;
  public playbackSpeed: number = 1;
  public startTimestamp: number;
  public bufferingPercentage: number = 100;

  constructor(media: MediaItem, stream: StreamSource, startTimeSeconds: number) {
    this.media = media;
    this.stream = stream;
    this.currentTime = startTimeSeconds;
    this.startTimestamp = Date.now();
  }
}
