import { Logger } from '../Logger';
import { ProviderRegistry } from './ProviderRegistry';
import { RequestScheduler, ScheduleOptions } from './RequestScheduler';
import { ProviderContext, IProvider, ProviderCapability, ProviderResult, ProviderErrorType, ProviderStatus } from './types';

export class ProviderManager {
  private registry: ProviderRegistry;
  private scheduler: RequestScheduler;
  private context: ProviderContext;
  private logger: Logger;

  constructor(context: ProviderContext, registry: ProviderRegistry, scheduler: RequestScheduler) {
    this.context = context;
    this.registry = registry;
    this.scheduler = scheduler;
    this.logger = context.logger;
  }

  public register(provider: IProvider, priority?: number): void {
    this.registry.register(provider, priority);
  }

  public unregister(id: string): void {
    this.registry.unregister(id);
  }

  public async initializeAll(): Promise<void> {
    const providers = this.registry.getEnabled();
    for (const { provider } of providers) {
      try {
        const scopedContext = { ...this.context, network: this.context.network.withProvider(provider.id) };
        await provider.initialize(scopedContext);
        if (provider.rateLimits) {
          this.context.network.setProviderLimits(provider.id, provider.rateLimits);
        }
        this.logger.info(`Initialized provider: ${provider.id}`);
        this.registry.updateHealth(provider.id, { status: ProviderStatus.READY });
      } catch (err) {
        this.logger.error(`Failed to initialize provider: ${provider.id}`, err);
        this.registry.updateHealth(provider.id, { status: ProviderStatus.ERROR });
      }
    }
  }

  public async shutdownAll(): Promise<void> {
    const providers = this.registry.getAll();
    for (const { provider } of providers) {
      try {
        await provider.shutdown();
      } catch (err) {
        this.logger.error(`Failed to shutdown provider: ${provider.id}`, err);
      }
    }
  }

  public async execute<T>(
    capability: ProviderCapability,
    action: (provider: IProvider) => Promise<T>,
    options: ScheduleOptions = {}
  ): Promise<ProviderResult<T>[]> {
    const registrations = this.registry.getByCapability(capability);
    const promises = registrations.map(reg => this.executeProvider(reg.provider, action, options));
    return Promise.all(promises);
  }

  public async executeFirstSuccessful<T>(
    capability: ProviderCapability,
    action: (provider: IProvider) => Promise<T>,
    options: ScheduleOptions = {}
  ): Promise<ProviderResult<T>> {
    const registrations = this.registry.getByCapability(capability);
    
    for (const reg of registrations) {
      const result = await this.executeProvider(reg.provider, action, options);
      if (result.data !== undefined) {
        return result;
      }
    }

    return {
      providerId: 'none',
      durationMs: 0,
      cached: false,
      error: {
        type: ProviderErrorType.PROVIDER_FAILURE,
        message: 'No provider successfully handled the request'
      }
    };
  }

  private async executeProvider<T>(
    provider: IProvider, 
    action: (provider: IProvider) => Promise<T>,
    options: ScheduleOptions
  ): Promise<ProviderResult<T>> {
    const start = Date.now();
    try {
      const data = await this.scheduler.schedule(() => action(provider), options);
      const durationMs = Date.now() - start;
      
      this.updateProviderHealthOnSuccess(provider.id, durationMs);
      
      return {
        providerId: provider.id,
        durationMs,
        cached: false,
        data,
      };
    } catch (err: any) {
      const durationMs = Date.now() - start;
      this.updateProviderHealthOnFailure(provider.id);
      
      let errorType = ProviderErrorType.UNKNOWN;
      if (err.message === 'Timeout') errorType = ProviderErrorType.TIMEOUT;
      else if (err.message === 'Authentication') errorType = ProviderErrorType.AUTHENTICATION;
      else if (err.message === 'RateLimit') errorType = ProviderErrorType.RATE_LIMIT;
      else if (err.message === 'Network' || err.message.includes('HTTP Error')) errorType = ProviderErrorType.NETWORK;
      else if (err.message === 'InvalidResponse') errorType = ProviderErrorType.INVALID_RESPONSE;
      
      return {
        providerId: provider.id,
        durationMs,
        cached: false,
        error: {
          type: errorType,
          message: err.message || 'Unknown error',
          originalError: err
        }
      };
    }
  }

  private updateProviderHealthOnSuccess(id: string, durationMs: number): void {
    const reg = this.registry.get(id);
    if (!reg) return;

    const currentAvg = reg.health.latency || durationMs;
    const newAvg = (currentAvg * 0.9) + (durationMs * 0.1);

    this.registry.updateHealth(id, {
      status: ProviderStatus.READY,
      lastSuccessfulRequest: Date.now(),
      latency: newAvg,
    });
  }

  private updateProviderHealthOnFailure(id: string): void {
    const reg = this.registry.get(id);
    if (!reg) return;

    const count = (reg.health.errorCount || 0) + 1;
    this.registry.updateHealth(id, {
      status: count > 3 ? ProviderStatus.DEGRADED : ProviderStatus.READY,
      errorCount: count,
    });
  }
}
