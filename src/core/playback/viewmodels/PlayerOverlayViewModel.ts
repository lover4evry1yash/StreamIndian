import { PlaybackManager } from '../PlaybackManager';
import { PlaybackState, PlaybackSession, AudioTrack, SubtitleTrack } from '../';

export class PlayerOverlayViewModel {
  private playbackManager: PlaybackManager;

  constructor(playbackManager: PlaybackManager) {
    this.playbackManager = playbackManager;
  }

  public getSession(): PlaybackSession | null {
    return this.playbackManager.getSession();
  }

  public getState(): PlaybackState {
    return this.playbackManager.getState();
  }

  public play() {
    this.playbackManager.play();
  }

  public pause() {
    this.playbackManager.pause();
  }

  public seek(seconds: number) {
    this.playbackManager.seek(seconds);
  }

  public fastForward(seconds: number = 10) {
    this.playbackManager.fastForward(seconds);
  }

  public rewind(seconds: number = 10) {
    this.playbackManager.rewind(seconds);
  }

  public getAudioTracks(): AudioTrack[] {
    return this.playbackManager.getAudioTracks();
  }

  public setAudioTrack(index: number): void {
    this.playbackManager.setAudioTrack(index);
  }

  public getSubtitleTracks(): SubtitleTrack[] {
    return this.playbackManager.getSubtitleTracks();
  }

  public setSubtitleTrack(index: number | null): void {
    this.playbackManager.setSubtitleTrack(index);
  }
}
