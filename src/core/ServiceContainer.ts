export class ServiceContainer {
  private static instance: ServiceContainer;
  private services: Map<string, any> = new Map();

  private constructor() {}

  public static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  public register<T>(identifier: string, service: T): void {
    if (this.services.has(identifier)) {
      console.warn(`[ServiceContainer] Service ${identifier} is already registered. Overwriting.`);
    }
    this.services.set(identifier, service);
  }

  public resolve<T>(identifier: string): T {
    const service = this.services.get(identifier);
    if (!service) {
      throw new Error(`[ServiceContainer] Service ${identifier} not found.`);
    }
    return service as T;
  }

  public clear(): void {
    this.services.clear();
  }
}

// Convenience export for the singleton
export const container = ServiceContainer.getInstance();
