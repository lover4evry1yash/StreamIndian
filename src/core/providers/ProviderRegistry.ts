import { IProvider, ProviderCapabilities, ProviderCapability, ProviderHealth, ProviderStatus } from './types';
import { Logger } from '../Logger';

export interface ProviderRegistration {
  provider: IProvider;
  priority: number;
  enabled: boolean;
  health: ProviderHealth;
}

export class ProviderRegistry {
  private providers: Map<string, ProviderRegistration> = new Map();
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  public register(provider: IProvider, priority?: number): void {
    if (this.providers.has(provider.id)) {
      this.logger.warn(`Provider ${provider.id} is already registered. Overwriting.`);
    }
    
    this.providers.set(provider.id, {
      provider,
      priority: priority ?? provider.priority ?? 2,
      enabled: provider.enabled ?? true,
      health: {
        status: ProviderStatus.UNINITIALIZED,
        availability: 1,
        latency: 0,
        lastSuccessfulRequest: 0,
        errorCount: 0,
      }
    });

    this.logger.info(`Registered provider: ${provider.name} (${provider.id})`);
  }

  public unregister(id: string): void {
    if (this.providers.has(id)) {
      this.providers.delete(id);
      this.logger.info(`Unregistered provider: ${id}`);
    }
  }

  public get(id: string): ProviderRegistration | undefined {
    return this.providers.get(id);
  }

  public getAll(): ProviderRegistration[] {
    return Array.from(this.providers.values());
  }

  public getEnabled(): ProviderRegistration[] {
    return this.getAll().filter(r => r.enabled);
  }

  public getByCapability(capability: keyof ProviderCapabilities): ProviderRegistration[] {
    return this.getEnabled()
      .filter(r => r.provider.capabilities && r.provider.capabilities[capability])
      .sort((a, b) => b.priority - a.priority);
  }

  public setEnabled(id: string, enabled: boolean): void {
    const reg = this.providers.get(id);
    if (reg) {
      reg.enabled = enabled;
      this.logger.info(`Provider ${id} enabled state set to ${enabled}`);
    }
  }

  public updateHealth(id: string, healthUpdate: Partial<ProviderHealth>): void {
    const reg = this.providers.get(id);
    if (reg) {
      reg.health = { ...reg.health, ...healthUpdate };
    }
  }
}
