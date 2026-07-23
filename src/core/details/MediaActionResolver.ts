import { MediaDetails, MediaAction, MediaActionType } from './types';

export class MediaActionResolver {
  public resolveActions(details: MediaDetails): MediaAction[] {
    const actions: MediaAction[] = [];
    const media = details.data;

    // Primary Action
    if (details.type === 'series' || details.type === 'anime') {
      // Logic for Resume vs Play First Episode could go here
      actions.push({
        id: 'play_series',
        type: MediaActionType.PLAY,
        label: 'Play First Episode', // or Resume
        isPrimary: true
      });
    } else {
      actions.push({
        id: 'play_movie',
        type: MediaActionType.PLAY,
        label: 'Play Movie',
        isPrimary: true
      });
    }

    if ((media as any).videos && (media as any).videos.some(v => v.type.toLowerCase() === 'trailer')) {
      actions.push({
        id: 'trailer',
        type: MediaActionType.WATCH_TRAILER,
        label: 'Trailer',
        icon: 'play-circle'
      });
    }

    actions.push({
      id: 'watchlist',
      type: MediaActionType.ADD_TO_WATCHLIST,
      label: 'Add to Watchlist',
      icon: 'plus'
    });

    actions.push({
      id: 'mark_watched',
      type: MediaActionType.MARK_WATCHED,
      label: 'Mark as Watched',
      icon: 'check'
    });

    return actions;
  }
}
