import { EventBus } from '../EventBus';

export class ModalManager {
  private activeModals: string[] = [];
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  public open(modalId: string, data?: any): void {
    if (!this.activeModals.includes(modalId)) {
      this.activeModals.push(modalId);
      this.eventBus.emit('MODAL_OPENED', { modalId, data });
    }
  }

  public close(modalId: string): void {
    const index = this.activeModals.indexOf(modalId);
    if (index > -1) {
      this.activeModals.splice(index, 1);
      this.eventBus.emit('MODAL_CLOSED', { modalId });
    }
  }

  public closeTop(): string | undefined {
    const modalId = this.activeModals.pop();
    if (modalId) {
      this.eventBus.emit('MODAL_CLOSED', { modalId });
      return modalId;
    }
    return undefined;
  }

  public isModalOpen(modalId: string): boolean {
    return this.activeModals.includes(modalId);
  }
  
  public hasAnyModalOpen(): boolean {
    return this.activeModals.length > 0;
  }
}
