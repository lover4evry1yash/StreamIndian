export class DeviceCapabilities {
  private _isTizen: boolean = false;
  private _tizenVersion: string | null = null;
  private _isEmulator: boolean = false;

  constructor() {
    this.detectCapabilities();
  }

  private detectCapabilities(): void {
    // Basic Tizen check based on the global object injected by Samsung
    this._isTizen = typeof window !== 'undefined' && (window as any).tizen !== undefined;
    
    if (this._isTizen) {
      try {
        const systemInfo = (window as any).tizen.systeminfo;
        this._tizenVersion = systemInfo.getCapability('http://tizen.org/feature/platform.version') || null;
        
        // Emulators typically report specific device strings or lack certain hardware features,
        // this is a basic heuristic.
        const model = systemInfo.getCapability('http://tizen.org/system/model_name');
        if (model && (model.includes('Emulator') || model.includes('SDK'))) {
          this._isEmulator = true;
        }
      } catch (error) {
        console.warn('[DeviceCapabilities] Failed to get detailed Tizen system info:', error);
      }
    }
  }

  public isTizen(): boolean {
    return this._isTizen;
  }

  public getTizenVersion(): string | null {
    return this._tizenVersion;
  }

  public isEmulator(): boolean {
    return this._isEmulator;
  }

  public getPlatform(): 'tizen' | 'browser' {
    return this._isTizen ? 'tizen' : 'browser';
  }
}
