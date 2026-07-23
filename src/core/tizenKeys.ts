/**
 * StreamIndian - Tizen Remote Control Key Map & Listener
 * Maps standard Keyboard events and Tizen TV remote keycodes (37, 38, 39, 40, 13, 10009, etc.)
 */

export const TIZEN_KEY_CODES: Record<number, string> = {
  37: 'KEY_LEFT',
  38: 'KEY_UP',
  39: 'KEY_RIGHT',
  40: 'KEY_DOWN',
  13: 'KEY_ENTER',
  10009: 'KEY_RETURN', // Samsung Tizen Back button
  27: 'KEY_RETURN',    // Escape key in browser simulation
  8: 'KEY_RETURN',     // Backspace key
  415: 'KEY_PLAY',
  19: 'KEY_PAUSE',
  10252: 'KEY_PLAY_PAUSE',
  32: 'KEY_PLAY_PAUSE', // Spacebar in browser
  413: 'KEY_STOP',
  403: 'KEY_RED',
  404: 'KEY_GREEN',
  405: 'KEY_YELLOW',
  406: 'KEY_BLUE',
};

export type KeyActionCallback = (action: string, e: KeyboardEvent) => void;

class TizenKeyController {
  private listeners: Set<KeyActionCallback> = new Set();
  private registeredWithTizen = false;

  constructor() {
    this.initTizenKeyRegistration();
    this.attachGlobalListener();
  }

  private initTizenKeyRegistration() {
    if (typeof window !== 'undefined' && (window as any).tizen) {
      try {
        const tizen = (window as any).tizen;
        const keysToRegister = [
          'MediaPlay',
          'MediaPause',
          'MediaPlayPause',
          'MediaStop',
          'MediaFastForward',
          'MediaRewind',
          '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
        ];
        keysToRegister.forEach((key) => {
          try {
            tizen.tvinput.registerKey(key);
          } catch (e) {
            // key registration may throw if key unavailable
          }
        });
        this.registeredWithTizen = true;
        console.log('[TizenKeyController] Successfully registered Tizen TV Remote keys.');
      } catch (err) {
        console.warn('[TizenKeyController] Not running inside native Tizen container or TVInput API missing.');
      }
    }
  }

  private attachGlobalListener() {
    if (typeof window === 'undefined') return;

    window.addEventListener('keydown', (e: KeyboardEvent) => {
      const mappedAction = TIZEN_KEY_CODES[e.keyCode] || this.fallbackKeyName(e.key);
      if (mappedAction) {
        // Notify all registered callbacks
        this.listeners.forEach((callback) => callback(mappedAction, e));
      }
    });
  }

  private fallbackKeyName(key: string): string | null {
    switch (key) {
      case 'ArrowLeft': return 'KEY_LEFT';
      case 'ArrowRight': return 'KEY_RIGHT';
      case 'ArrowUp': return 'KEY_UP';
      case 'ArrowDown': return 'KEY_DOWN';
      case 'Enter': return 'KEY_ENTER';
      case 'Escape':
      case 'Backspace': return 'KEY_RETURN';
      case ' ': return 'KEY_PLAY_PAUSE';
      default: return null;
    }
  }

  public addListener(callback: KeyActionCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public isNativeTizen(): boolean {
    return this.registeredWithTizen || (typeof window !== 'undefined' && !!(window as any).tizen);
  }
}

export const tizenKeyController = new TizenKeyController();
