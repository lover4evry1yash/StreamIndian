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

  constructor(eventBus: EventBus, logger: Logger, device: DeviceCapabilities) {
    this.eventBus = eventBus;
    this.logger = logger;
    this.device = device;
  }

  public initialize(): void {
    this.logger.info('Initializing AppLifecycle...');
    this.registerVisibilityChangeListener();
    this.registerExitListener();
  }

  private registerVisibilityChangeListener(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.logger.info('App went to background');
        this.eventBus.emit(AppLifecycleEvent.BACKGROUND);
      } else {
        this.logger.info('App returned to foreground');
        this.eventBus.emit(AppLifecycleEvent.FOREGROUND);
      }
    });
  }

  private registerExitListener(): void {
    // Tizen specific exit event or standard unload
    window.addEventListener('unload', () => {
      this.logger.info('App is exiting');
      this.eventBus.emit(AppLifecycleEvent.EXIT);
    });
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
