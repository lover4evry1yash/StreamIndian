import { HomeCatalogService } from '../services/HomeCatalogService';
import { Logger } from '../Logger';
import { MediaItem } from '../../types/tizen';
import { Shelf, ShelfContext } from '../models/Shelf';
import { ShelfEngine } from './ShelfArchitecture';

export class HomeViewModel {
  private homeCatalogService: HomeCatalogService;
  private logger: Logger;
  private catalog: MediaItem[] = [];
  private loading: boolean = false;
  private error: string | null = null;
  
  private currentContext: ShelfContext = {
    language: 'All',
    region: 'IN', // Default region
    userHistory: [] // Future: fetch from user profile
  };

  constructor(homeCatalogService: HomeCatalogService, logger: Logger) {
    this.homeCatalogService = homeCatalogService;
    this.logger = logger;
  }

  public async load(language: string): Promise<void> {
    this.currentContext.language = language;
    this.loading = true;
    this.error = null;
    this.logger.info(`HomeViewModel loading catalog for language: ${language}`);
    
    try {
      this.catalog = await this.homeCatalogService.getUnifiedCatalog('All'); // We fetch all to allow shelves to curate
      if (!this.catalog || this.catalog.length === 0) {
        this.logger.warn("HomeViewModel received empty catalog");
      }
    } catch (error) {
      this.logger.error("HomeViewModel failed to load catalog", error);
      this.error = "Failed to load catalog";
      this.catalog = [];
    } finally {
      this.loading = false;
    }
  }

  public async refresh(): Promise<void> {
    await this.load(this.currentContext.language || 'All');
  }

  public getCatalog(): MediaItem[] {
    return this.catalog;
  }

  public isLoading(): boolean {
    return this.loading;
  }

  public getError(): string | null {
    return this.error;
  }

  public getHero(): MediaItem | null {
    if (this.catalog.length === 0) return null;
    const shelves = ShelfEngine.buildShelves(this.catalog, this.currentContext);
    const featuredShelf = shelves.find(s => s.type === 'featured');
    if (featuredShelf && featuredShelf.items.length > 0) {
      return featuredShelf.items[0];
    }
    return this.catalog[0];
  }

  public getShelves(): Shelf[] {
    if (this.catalog.length === 0) return [];
    
    return ShelfEngine.buildShelves(this.catalog, this.currentContext)
      .filter(s => s.type !== 'featured'); // Do not show featured shelf in the rows
  }
}
