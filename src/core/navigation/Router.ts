export interface Route {
  id: string;
  params?: Record<string, any>;
}

import { EventBus } from '../EventBus';

export class Router {
  private currentRoute: Route | null = null;
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  public navigate(routeId: string, params?: Record<string, any>): void {
    this.currentRoute = { id: routeId, params };
    this.eventBus.emit('ROUTE_CHANGED', this.currentRoute);
  }

  public getCurrentRoute(): Route | null {
    return this.currentRoute;
  }
}
