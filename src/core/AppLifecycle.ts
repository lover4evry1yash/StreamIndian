import { EventBus } from './EventBus';
import { Logger } from './Logger';
import { DeviceCapabilities } from './DeviceCapabilities';

export enum AppLifecycleEvent {
  FOREGROUND = 'FOREGROUND',
  BACKGROUND = 'BACKGROUND',
  EXIT = 'EXIT',
}

export class AppLifecycle {
  private eventBus: EventBus;
  private logger: Logger;
  private device: DeviceCapabilities;
  private initialized = false;
  private visibilityListener: (() => void) | null = null;
  private exitListener: (() => void) | null = null;

  constructor(eventBus: EventBus, logger: Logger, device: DeviceCapabilities) {
    this.eventBus = eventBus;
    this.logger = logger;
    this.device = device;
  }

  public initialize(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.logger.info('Initializing AppLifecycle...');
    this.registerVisibilityChangeListener();
    this.registerExitListener();
  }

  private registerVisibilityChangeListener(): void {
    this.visibilityListener = () => {
      if (document.hidden) {
        this.logger.info('App went to background');
        this.eventBus.emit(AppLifecycleEvent.BACKGROUND);
      } else {
        this.logger.info('App returned to foreground');
        this.eventBus.emit(AppLifecycleEvent.FOREGROUND);
      }
    };
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', this.visibilityListener);
  }

  private registerExitListener(): void {
    // Tizen specific exit event or standard unload
    this.exitListener = () => {
      this.logger.info('App is exiting');
      this.eventBus.emit(AppLifecycleEvent.EXIT);
    };
    if (typeof window !== 'undefined') window.addEventListener('unload', this.exitListener);
  }

  public destroy(): void {
    if (this.visibilityListener && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityListener);
    }
    if (this.exitListener && typeof window !== 'undefined') {
      window.removeEventListener('unload', this.exitListener);
    }
    this.visibilityListener = null;
    this.exitListener = null;
    this.initialized = false;
  }

  public exitApp(): void {
    this.logger.info('Requesting app exit');
    this.eventBus.emit(AppLifecycleEvent.EXIT);
    
    if (this.device.isTizen()) {
      try {
        (window as any).tizen.application.getCurrentApplication().exit();
      } catch (error) {
        this.logger.error('Failed to exit Tizen application:', error);
      }
    } else {
      window.close();
    }
  }
}
