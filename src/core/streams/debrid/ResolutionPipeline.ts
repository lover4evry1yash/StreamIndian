import { SourceManager } from '../sources/SourceManager';
import { DebridManager } from './DebridManager';
import { DuplicateFilter } from './DuplicateFilter';
import { PresentationMapper } from './PresentationMapper';
import { RankingEngine } from './RankingEngine';
import { MediaSearchQuery, StreamSortOptions } from '../types';
import { StreamPresentationModel } from '../../../types/tizen';

export class ResolutionPipeline {
  private sourceManager: SourceManager;
  private debridManager: DebridManager;
  private duplicateFilter: DuplicateFilter;
  private presentationMapper: PresentationMapper;
  private rankingEngine: RankingEngine;

  constructor(sourceManager: SourceManager, debridManager: DebridManager) {
    this.sourceManager = sourceManager;
    this.debridManager = debridManager;
    this.duplicateFilter = new DuplicateFilter();
    this.presentationMapper = new PresentationMapper();
    this.rankingEngine = new RankingEngine();
  }

  public async execute(query: MediaSearchQuery, options: StreamSortOptions): Promise<StreamPresentationModel[]> {
    // 1. Source Discovery
    const rawSources = await this.sourceManager.search(query);

    // 2. Duplicate Filtering
    const uniqueSources = this.duplicateFilter.filter(rawSources);

    // 3. Collect infoHashes for Debrid Cache Matrix check
    const infoHashes = uniqueSources
      .filter(s => ['torrent', 'magnet'].includes(s.sourceType) && s.infoHash)
      .map(s => s.infoHash as string);

    // 4. Multi-Provider Cache Matrix Check
    const cacheMatrixMap = await this.debridManager.getCacheMatrix(infoHashes);

    // 5. Map to Presentation Models
    const presentationModels = uniqueSources.map(source => {
      const hash = source.infoHash || '';
      const cacheMatrix = cacheMatrixMap[hash] || {};
      return this.presentationMapper.map(source, cacheMatrix);
    });

    // 6. Rank Streams
    return this.rankingEngine.rank(presentationModels, options);
  }
}
