import React from 'react';
import { Bootstrap } from './Bootstrap';

export type AppFeature = 'search' | 'details' | 'playback' | 'iptv' | 'watchlist' | 'audit' | 'settings' | 'remote';

export class FeatureLoader {
  /**
   * Loads a feature by simultaneously triggering dynamic component import 
   * and any required background service initialization.
   */
  public static load<T>(
    feature: AppFeature,
    importFn: () => Promise<{ default: React.ComponentType<T> }>
  ): React.LazyExoticComponent<React.ComponentType<T>> {
    return React.lazy(() => {
      // For features that require Bootstrap on-demand initialization
      let initPromise: Promise<void> = Promise.resolve();
      if (
        feature === 'search' ||
        feature === 'details' ||
        feature === 'playback' ||
        feature === 'iptv' ||
        feature === 'watchlist'
      ) {
        // @ts-ignore
        initPromise = Bootstrap.initializeOnDemand(feature);
      }
      
      return Promise.all([
        initPromise,
        importFn()
      ]).then(([_, module]) => module);
    });
  }
}
