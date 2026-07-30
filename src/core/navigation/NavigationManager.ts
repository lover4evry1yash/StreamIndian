import { Router, Route } from './Router';
import { BackStack, BackStackEntry } from './BackStack';
import { ModalManager } from './ModalManager';
import { FocusEngine, FocusNode } from './FocusEngine';
import { EventBus } from '../EventBus';
import { tizenKeyController } from '../tizenKeys';
import { AppLifecycle } from '../AppLifecycle';

export class NavigationManager {
  public router: Router;
  public backStack: BackStack;
  public modalManager: ModalManager;
  public focusEngine: FocusEngine;
  private eventBus: EventBus;
  private lifecycle: AppLifecycle;

  constructor(eventBus: EventBus, lifecycle: AppLifecycle) {
    this.eventBus = eventBus;
    this.lifecycle = lifecycle;
    this.router = new Router(eventBus);
    this.backStack = new BackStack();
    this.modalManager = new ModalManager(eventBus);
    this.focusEngine = new FocusEngine(eventBus);

    this.registerKeyListeners();
  }

  private registerKeyListeners(): void {
    tizenKeyController.addListener((action: string, e: KeyboardEvent) => {
      if (['KEY_UP', 'KEY_DOWN', 'KEY_LEFT', 'KEY_RIGHT', 'KEY_ENTER'].includes(action)) {
        e.preventDefault();
      }

      if (action === 'KEY_RETURN') {
        this.handleBack();
        return;
      }

      this.focusEngine.handleKeyEvent(action);
    });
  }

  public openRoute(routeId: string, params?: Record<string, any>, addToBackStack: boolean = true): void {
    const current = this.router.getCurrentRoute();
    const focusedId = this.focusEngine.getFocusedNodeId() ?? undefined;
    if (current && addToBackStack) {
      this.backStack.push({ type: 'route', id: current.id, data: current.params, focusedId });
    }
    this.router.navigate(routeId, params);
  }

  public openModal(modalId: string, data?: any): void {
    const focusedId = this.focusEngine.getFocusedNodeId() ?? undefined;
    this.backStack.push({ type: 'modal', id: modalId, data, focusedId });
    this.modalManager.open(modalId, data);
    this.focusEngine.setActiveGroup(modalId);
  }

  public closeModal(modalId: string): void {
    this.modalManager.close(modalId);

    // Clean up from backstack if it's the current one
    const peek = this.backStack.peek();
    let restoreFocusId: string | undefined;
    if (peek && peek.type === 'modal' && peek.id === modalId) {
      const popped = this.backStack.pop();
      restoreFocusId = popped?.focusedId;
    }

    // Restore focus group
    const newPeek = this.backStack.peek();
    if (newPeek && newPeek.type === 'modal') {
       this.focusEngine.setActiveGroup(newPeek.id);
    } else {
       this.focusEngine.setActiveGroup('main');
    }

    if (restoreFocusId) {
       // Allow React a tick to mount elements if needed, though they might already be mounted
       setTimeout(() => {
          this.focusEngine.setFocusedNode(restoreFocusId!);
       }, 50);
    }
  }

  private customBackHandler: (() => boolean) | null = null;

  public setCustomBackHandler(handler: () => boolean): void {
    this.customBackHandler = handler;
  }

  public handleBack(): void {
    if (this.customBackHandler && this.customBackHandler()) {
      return; // Handled by custom logic
    }

    if (this.backStack.canGoBack()) {
      const entry = this.backStack.pop();
      if (entry) {
        if (entry.type === 'modal') {
           this.modalManager.close(entry.id);
           const next = this.backStack.peek();
           if (next && next.type === 'modal') {
              this.focusEngine.setActiveGroup(next.id);
           } else {
              this.focusEngine.setActiveGroup('main');
           }
        } else if (entry.type === 'route') {
           this.router.navigate(entry.id, entry.data);
           this.focusEngine.setActiveGroup('main');
        }

        if (entry.focusedId) {
           setTimeout(() => {
              this.focusEngine.setFocusedNode(entry.focusedId!);
           }, 50);
        }
      }
    } else {
      this.lifecycle.exitApp();
    }
  }
}
