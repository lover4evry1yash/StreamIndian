import { ProviderContext } from "../../providers/types";
import { EventBus } from '../../EventBus';
import { Logger } from '../../Logger';
import { IDebridProvider, TransferResult, TransferStatus, DebridDiagnostics } from './types';
import { StreamSource } from '../../../types/tizen';
import { CanonicalStreamSource } from '../types';

export class DebridManager {
  private providers: Map<string, IDebridProvider> = new Map();
  private eventBus: EventBus;
  private logger: Logger;
  private preferredProviderId: string | null = null;
  private backgroundCheckInterval: number = 30000;

  constructor(eventBus: EventBus, logger: Logger) {
    this.eventBus = eventBus;
    this.logger = logger;
  }

  public registerProvider(provider: IDebridProvider): void {
    if (this.providers.has(provider.id)) {
      this.logger.warn(`DebridManager: Provider ${provider.id} already registered. Overwriting.`);
    }
    this.providers.set(provider.id, provider);
    this.logger.info(`DebridManager: Registered provider ${provider.id} (${provider.name})`);
  }

  public getProvider(id: string): IDebridProvider | undefined {
    return this.providers.get(id);
  }

  public getAllProviders(): IDebridProvider[] {
    return Array.from(this.providers.values()).sort((a, b) => b.priority - a.priority);
  }

  public setPreferredProvider(id: string): void {
    if (this.providers.has(id)) {
      this.preferredProviderId = id;
    }
  }

  public async initializeAll(context: ProviderContext): Promise<void> {
    const initPromises = this.getAllProviders().map(async (provider) => {
      try {
        await provider.initialize(context);
        this.logger.info(`DebridManager: Initialized provider ${provider.id}`);
      } catch (err) {
        this.logger.error(`DebridManager: Failed to initialize provider ${provider.id}`, err);
      }
    });
    await Promise.allSettled(initPromises);
  }

  public async getCacheMatrix(infoHashes: string[]): Promise<Record<string, Record<string, boolean>>> {
    if (infoHashes.length === 0) return {};
    
    // Matrix format: { infoHash: { torbox: true, realdebrid: false } }
    const matrix: Record<string, Record<string, boolean>> = {};
    infoHashes.forEach(h => { matrix[h] = {}; });

    const checkPromises = this.getAllProviders().map(async (provider) => {
      try {
        const results = await provider.checkCache(infoHashes);
        Object.keys(results).forEach(hash => {
          if (!matrix[hash]) matrix[hash] = {};
          matrix[hash][provider.id] = results[hash];
        });
      } catch (err) {
        this.logger.error(`DebridManager: Cache check failed for ${provider.id}`, err);
        // Default to uncached on error
        infoHashes.forEach(hash => {
           if (!matrix[hash]) matrix[hash] = {};
           matrix[hash][provider.id] = false;
        });
      }
    });

    await Promise.allSettled(checkPromises);
    return matrix;
  }

  public async resolve(infoHash: string, providerId?: string, fileIndex?: number): Promise<{ url: string | null; providerId: string | null }> {
    const providersToTry = this.getPrioritizedProviders(providerId);

    for (const provider of providersToTry) {
      try {
        const url = await provider.resolve(infoHash, fileIndex);
        if (url) {
          return { url, providerId: provider.id };
        }
      } catch (err) {
         this.logger.error(`DebridManager: Resolve failed for ${provider.id} on hash ${infoHash}`, err);
      }
    }
    
    return { url: null, providerId: null };
  }
  
  public async createTransfer(infoHash: string, magnet?: string, providerId?: string): Promise<{ result: TransferResult | null; providerId: string | null }> {
     const providersToTry = this.getPrioritizedProviders(providerId);
     
     for (const provider of providersToTry) {
       try {
         const result = await provider.createTransfer(infoHash, magnet);
         if (result) {
            return { result, providerId: provider.id };
         }
       } catch(err) {
         this.logger.error(`DebridManager: Transfer creation failed for ${provider.id} on hash ${infoHash}`, err);
       }
     }
     
     return { result: null, providerId: null };
  }
  
  public async pollTransfer(transferId: string, providerId: string): Promise<TransferStatus | null> {
     const provider = this.getProvider(providerId);
     if (!provider) return null;
     
     try {
       return await provider.pollTransfer(transferId);
     } catch(err) {
       this.logger.error(`DebridManager: Poll transfer failed for ${provider.id} on transfer ${transferId}`, err);
       return null;
     }
  }

  private getPrioritizedProviders(preferredId?: string): IDebridProvider[] {
    const all = this.getAllProviders();
    const prefId = preferredId || this.preferredProviderId;
    if (!prefId) return all;
    
    const prefProvider = all.find(p => p.id === prefId);
    const others = all.filter(p => p.id !== prefId);
    
    return prefProvider ? [prefProvider, ...others] : all;
  }
  
  public getDiagnostics(): Record<string, DebridDiagnostics> {
     const diag: Record<string, DebridDiagnostics> = {};
     this.providers.forEach(p => {
       diag[p.id] = p.getDiagnostics();
     });
     return diag;
  }
}
