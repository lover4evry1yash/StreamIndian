import React, { createContext, useContext, ReactNode } from 'react';
import { container, ServiceContainer } from '../core/ServiceContainer';

// Import specific services for strong typing
import { EventBus } from '../core/EventBus';
import { PlaybackManager } from '../core/playback';
import { AVPlayManager } from '../core/avplay';
import { SettingsManager } from '../core/storage/SettingsManager';
import { SearchManager } from '../core/search';
import { ImageManager } from '../core/rendering/ImageManager';
import { NavigationManager } from '../core/navigation/NavigationManager';
import { RenderMetrics } from '../core/rendering/RenderMetrics';
import { SourceManager } from '../core/streams/sources/SourceManager';
import { ResolutionManager } from '../core/streams/ResolutionManager';
import { DebridManager } from '../core/streams/debrid/DebridManager';
import { TransferManager } from '../core/streams/debrid/TransferManager';
import { MediaDetailsManager } from '../core/details/MediaDetailsManager';
import { MediaDetailsViewModel } from '../core/details/MediaDetailsViewModel';
import { ProviderManager } from '../core/providers';
import { MetadataManager } from '../core/metadata/MetadataManager';
import { DetailService } from '../core/services/DetailService';
import { SearchService } from '../core/services/SearchService';
import { SearchViewModel } from '../core/search/SearchViewModel';
import { HomeCatalogService } from '../core/services/HomeCatalogService';
import { HomeViewModel } from '../core/home/HomeViewModel';
import { StreamViewModel } from '../core/streams/viewmodels/StreamViewModel';
import { PlayerOverlayViewModel } from '../core/playback/viewmodels/PlayerOverlayViewModel';

const ServiceContext = createContext<ServiceContainer>(container);

export const ServiceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ServiceContext.Provider value={container}>
      {children}
    </ServiceContext.Provider>
  );
};

export const useContainer = (): ServiceContainer => {
  return useContext(ServiceContext);
};

export const useEventBus = () => useContainer().resolve<EventBus>('EventBus');
export const usePlaybackManager = () => useContainer().resolve<PlaybackManager>('PlaybackManager');
export const useAVPlayManager = () => useContainer().resolve<AVPlayManager>('AVPlayManager');
export const useSettingsManager = () => useContainer().resolve<SettingsManager>('SettingsManager');
export const useImageManager = () => useContainer().resolve<ImageManager>('ImageManager');
export const useNavigationManager = () => useContainer().resolve<NavigationManager>('NavigationManager');
export const useRenderMetrics = () => useContainer().resolve<RenderMetrics>('RenderMetrics');
export const useSourceManager = () => useContainer().resolve<SourceManager>('SourceManager');
export const useResolutionManager = () => useContainer().resolve<ResolutionManager>('ResolutionManager');
export const useDebridManager = () => useContainer().resolve<DebridManager>('DebridManager');
export const useTransferManager = () => useContainer().resolve<TransferManager>('TransferManager');
export const useMediaDetailsManager = () => useContainer().resolve<MediaDetailsManager>('MediaDetailsManager');
export const useMediaDetailsViewModel = () => useContainer().resolve<MediaDetailsViewModel>('MediaDetailsViewModel');
export const useProviderManager = () => useContainer().resolve<ProviderManager>('ProviderManager');
export const useMetadataManager = () => useContainer().resolve<MetadataManager>('MetadataManager');
export const useDetailService = () => useContainer().resolve<DetailService>('DetailService');
export const useSearchService = () => useContainer().resolve<SearchService>('SearchService');
export const useSearchViewModel = () => useContainer().resolve<SearchViewModel>('SearchViewModel');
export const useHomeCatalogService = () => useContainer().resolve<HomeCatalogService>('HomeCatalogService');
export const useHomeViewModel = () => useContainer().resolve<HomeViewModel>('HomeViewModel');
export const useStreamViewModel = () => useContainer().resolve<StreamViewModel>('StreamViewModel');
export const usePlayerOverlayViewModel = () => useContainer().resolve<PlayerOverlayViewModel>('PlayerOverlayViewModel');
