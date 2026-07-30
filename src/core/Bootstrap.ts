import { IptvManager, IptvProvider } from './iptv';
import { IdMapperService } from './metadata/IdMapperService';
import { ExternalIdRegistry } from './providers/ExternalIdRegistry';
import { ArtworkAggregator } from './metadata/ArtworkAggregator';
import {
 container } from './ServiceContainer';
import {
  ResolutionManager,
  ResolverManager,
  TorBoxResolver,
  RealDebridResolver,
  PremiumizeResolver,
  EasyDebridResolver,
  SourceManager,
  DirectHttpProvider,
  HlsProvider,
  DashProvider,
  TorrentSourceProvider,
  GatewaySourceProvider,
  DirectResolver,
  DebridManager,
  TransferManager,
  TorBoxDebridProvider,
  RealDebridProvider,
  PremiumizeDebridProvider,
  EasyDebridProvider,
  AllDebridProvider,
  DebridLinkProvider
} from './streams';
import { StreamViewModel } from './streams/viewmodels/StreamViewModel';
import { PlayerOverlayViewModel } from './playback/viewmodels/PlayerOverlayViewModel';
import { StreamDiscoveryService } from './streams/services/StreamDiscoveryService';
import { StreamResolutionService } from './streams/services/StreamResolutionService';
import { StreamSortingService } from './streams/services/StreamSortingService';
import { EventBus } from './EventBus';
import { Logger, LogLevel } from './Logger';
import { DetailService } from './services/DetailService';
import { SearchService } from './services/SearchService';
import { SearchViewModel } from './search/SearchViewModel';
import { HomeCatalogService } from './services/HomeCatalogService';
import { HomeViewModel } from './home/HomeViewModel';
import { Config } from './Config';
import { DeviceCapabilities } from './DeviceCapabilities';
import { NetworkClient } from './NetworkClient';
import { AppLifecycle } from './AppLifecycle';

import { NavigationManager } from './navigation';
import { PlaybackManager } from './playback';
import { AVPlayManager } from './avplay';
import {
  ProviderRegistry,
  RequestScheduler,
  ProviderManager,
  ProviderContext,
} from './providers';
import { TMDBProvider } from './providers/tmdb';
import { TVDBProvider } from './providers/tvdb';
import { AniListProvider } from './providers/anilist';
import { FanartProvider } from './providers/fanart';
import { RPDBProvider } from './providers/rpdb';
import { MDBListProvider } from './providers/mdblist';
import { TraktProvider } from './providers/trakt';
import {
  MetadataRepository,
  MetadataManager,
  MetadataAggregator,
  ArtworkSelector
} from './metadata';
import {
  RenderMetrics,
  ImageManager,
  PrefetchManager
} from './rendering';
import {
  MediaDetailsRepository,
  MediaSectionBuilder,
  MediaActionResolver,
  MediaDetailsManager,
  MediaDetailsViewModel
} from './details';

import {
  SearchRepository,
  SearchManager
} from './search';
import {
  BrowserStorageProvider,
  StorageManager,
  CacheManager,
  SettingsManager,
  MetadataCache,
  ImageCache
} from './storage';

export class Bootstrap {
  public static async init(): Promise<void> {
    try {
      // 1. Initialize core utilities first
      const config = new Config();
      const logger = new Logger('StreamIndian');
      
      // Configure logger based on environment
      if (config.get('environment') === 'production') {
        logger.setLevel(LogLevel.WARN);
      } else {
        logger.setLevel(LogLevel.DEBUG);
      }

      logger.info('Starting bootstrap sequence...');

      // 2. Register basic services
      container.register('Config', config);
      container.register('Logger', logger);

      const eventBus = new EventBus();
      container.register('EventBus', eventBus);

      const device = new DeviceCapabilities();
      container.register('DeviceCapabilities', device);
      logger.info(`Platform detected: ${device.getPlatform()}`);

      const networkClient = new NetworkClient(logger);
      container.register('NetworkClient', networkClient);

      // 3. Initialize Storage & Cache
      const storageProvider = new BrowserStorageProvider();
      const storageManager = new StorageManager(storageProvider);
      container.register('StorageManager', storageManager);

      const settingsManager = new SettingsManager(storageManager, eventBus);
      await settingsManager.initialize();
      container.register('SettingsManager', settingsManager);

      const cacheManager = new CacheManager(storageManager);
      container.register('CacheManager', cacheManager);

      const metadataCache = new MetadataCache(cacheManager);
      container.register('MetadataCache', metadataCache);


      const imageCache = new ImageCache(cacheManager);
      container.register('ImageCache', imageCache);
      
      const renderMetrics = new RenderMetrics(logger);
      container.register('RenderMetrics', renderMetrics);
      
      


      // 4. Initialize App Lifecycle
      const lifecycle = new AppLifecycle(eventBus, logger, device);
      container.register('AppLifecycle', lifecycle);
      lifecycle.initialize();

      // 5. Initialize Navigation
      const navigationManager = new NavigationManager(eventBus, lifecycle);
      container.register('NavigationManager', navigationManager);

      // 6. Initialize Playback
      const avplayManager = new AVPlayManager();
      container.register('AVPlayManager', avplayManager);

      const playbackManager = new PlaybackManager(eventBus, logger, cacheManager, avplayManager);
      container.register('PlaybackManager', playbackManager);
      
      const playerOverlayViewModel = new PlayerOverlayViewModel(playbackManager);
      container.register('PlayerOverlayViewModel', playerOverlayViewModel);

      // 7. Initialize Providers
      const providerContext: ProviderContext = {
        settingsManager,
        network: networkClient,
        cache: cacheManager,
        storage: storageManager,
        logger,
        config,
        eventBus,
      };

      const providerRegistry = new ProviderRegistry(logger);
      container.register('ProviderRegistry', providerRegistry);

      const requestScheduler = new RequestScheduler(5); // Max 5 concurrent provider requests
      container.register('RequestScheduler', requestScheduler);

      const providerManager = new ProviderManager(providerContext, providerRegistry, requestScheduler);
      container.register('ProviderManager', providerManager);

      const artworkAggregator = new ArtworkAggregator(providerManager, cacheManager, logger);
      container.register('ArtworkAggregator', artworkAggregator);

      const imageManager = new ImageManager(networkClient, artworkAggregator, logger);
      container.register('ImageManager', imageManager);
      
            // 7.4.5 Initialize IPTV
      const iptvManager = new IptvManager(networkClient, logger);
      container.register('IptvManager', iptvManager);
      const iptvProvider = new IptvProvider(iptvManager);
      providerManager.register(iptvProvider, 4); // High priority for live TV

      // Register TMDB Provider
      const tmdbProvider = new TMDBProvider();
      providerManager.register(tmdbProvider, 3);

      providerManager.register(new TVDBProvider(), 2);
      providerManager.register(new AniListProvider(), 2);
      providerManager.register(new FanartProvider(), 2);
      providerManager.register(new RPDBProvider(), 2);
      providerManager.register(new MDBListProvider(), 2);
      providerManager.register(new TraktProvider(), 2);


      await providerManager.initializeAll();

      // 7.5 Initialize Stream Ecosystem
      const resolverManager = new ResolverManager(logger);
      resolverManager.registerResolver(new DirectResolver());
      resolverManager.registerResolver(new TorBoxResolver(''));
      resolverManager.registerResolver(new RealDebridResolver(''));
      resolverManager.registerResolver(new PremiumizeResolver(''));
      resolverManager.registerResolver(new EasyDebridResolver(''));
      await resolverManager.initializeAll(providerContext);
      container.register('ResolverManager', resolverManager);

      const sourceManager = new SourceManager(logger, cacheManager);
      sourceManager.registerProvider(new HlsProvider());
      sourceManager.registerProvider(new DashProvider());
      sourceManager.registerProvider(new TorrentSourceProvider());
const gatewayProvider = new GatewaySourceProvider(settingsManager);
      sourceManager.registerProvider(gatewayProvider);
      await sourceManager.initializeAll();
      container.register('SourceManager', sourceManager);

      const resolutionManager = new ResolutionManager(resolverManager, logger, cacheManager);
      container.register('ResolutionManager', resolutionManager);

      // Debrid Orchestration & Transfer Engine
      const debridManager = new DebridManager(eventBus, logger);
      debridManager.registerProvider(new TorBoxDebridProvider(''));
      debridManager.registerProvider(new RealDebridProvider(''));
      debridManager.registerProvider(new PremiumizeDebridProvider(''));
      debridManager.registerProvider(new EasyDebridProvider(''));
      debridManager.registerProvider(new AllDebridProvider(''));
      debridManager.registerProvider(new DebridLinkProvider(''));
      
      const preferredDebrid = settingsManager.getSettings().streams?.preferredDebrid;
      if (preferredDebrid) {
          debridManager.setPreferredProvider(preferredDebrid);
      }
      
      await debridManager.initializeAll(providerContext);
      container.register('DebridManager', debridManager);

      const transferManager = new TransferManager(eventBus, logger, debridManager);
      container.register('TransferManager', transferManager);

      const streamDiscoveryService = new StreamDiscoveryService(sourceManager);
      
      const streamResolutionService = new StreamResolutionService(resolutionManager, debridManager, transferManager);
      const streamSortingService = new StreamSortingService();

      const streamViewModel = new StreamViewModel(
         eventBus,
         streamDiscoveryService,
         streamResolutionService,
         streamSortingService,
         settingsManager
      );
      container.register('StreamViewModel', streamViewModel);

      // 8. Initialize Metadata Engine
      const metadataRepository = new MetadataRepository(cacheManager);
      container.register('MetadataRepository', metadataRepository);

      const mergePolicy = {
        overview: ['tmdb', 'tvdb', 'trakt', 'anilist'],
        episodes: ['tmdb', 'tvdb'],
        anime: ['anilist', 'tmdb'],
        artwork: ['fanart', 'rpdb', 'tmdb'],
        poster: ['rpdb', 'tmdb', 'tvdb'],
        ratings: ['trakt', 'mdblist', 'tmdb'],
        collections: ['mdblist', 'tmdb']
      };
      const externalIdRegistry = new ExternalIdRegistry();
      const idMapper = new IdMapperService(externalIdRegistry);
      const metadataAggregator = new MetadataAggregator(providerManager, mergePolicy, logger, idMapper);
      container.register('MetadataAggregator', metadataAggregator);

      const metadataManager = new MetadataManager(metadataAggregator, metadataRepository, eventBus, logger);
      container.register('MetadataManager', metadataManager);

      const homeCatalogService = new HomeCatalogService(metadataManager, logger);
      container.register('HomeCatalogService', homeCatalogService);

      const homeViewModel = new HomeViewModel(homeCatalogService, logger);
      container.register('HomeViewModel', homeViewModel);


      // 10. Initialize Details Engine
      const artworkSelector = new ArtworkSelector();
      container.register('ArtworkSelector', artworkSelector);

      const mediaDetailsRepository = new MediaDetailsRepository(metadataRepository);
      const mediaSectionBuilder = new MediaSectionBuilder();
      const mediaActionResolver = new MediaActionResolver();
      const detailService = new DetailService(metadataManager, logger);
      container.register('DetailService', detailService);
      const mediaDetailsManager = new MediaDetailsManager(
        detailService,
        mediaDetailsRepository,
        mediaSectionBuilder,
        mediaActionResolver,
        eventBus,
        logger
      );
      const mediaDetailsViewModel = new MediaDetailsViewModel(mediaDetailsManager, mediaDetailsRepository, artworkSelector);

      container.register('MediaDetailsManager', mediaDetailsManager);
      container.register('MediaDetailsViewModel', mediaDetailsViewModel);


      const prefetchManager = new PrefetchManager(metadataManager, imageManager, eventBus, logger);
      container.register('PrefetchManager', prefetchManager);

      // 9. Initialize Search Engine

      const searchRepository = new SearchRepository(cacheManager);
      container.register('SearchRepository', searchRepository);

      const searchManager = new SearchManager(providerManager, searchRepository, eventBus, logger, config);
      container.register('SearchManager', searchManager);

      const searchService = new SearchService(searchManager, logger);
      container.register('SearchService', searchService);

      const searchViewModel = new SearchViewModel(searchService, logger);
      container.register('SearchViewModel', searchViewModel);

      logger.info('Bootstrap sequence completed successfully.');
    } catch (error) {
      console.error('[Bootstrap] Critical failure during initialization:', error);
      throw error;
    }
  }
}
