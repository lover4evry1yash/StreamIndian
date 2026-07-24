import re

content = open('src/core/rendering/RenderMetrics.ts').read()

new_imports = """import { Logger } from '../Logger';

export interface RenderBudget {
  maxCards: number;
  maxImages: number;
  maxRenderTimeMs: number;
  maxMemoryMB: number;
}
"""

content = content.replace("import { Logger } from '../Logger';", new_imports)

# Add state
new_state = """  private logger: Logger;
  private enabled: boolean = false;
  
  private mountedComponents: Set<string> = new Set();
  private imageHits = 0;
  private imageMisses = 0;
  private imageLoadTimes: number[] = [];
  
  private renderDurations: number[] = [];
  private focusLatencies: number[] = [];
  private frames: number = 0;
  private lastFpsTime: number = 0;
  private currentFps: number = 60;
  private frameDrops: number = 0;
  
  private observer: PerformanceObserver | null = null;
  private activeBudgets: Map<string, RenderBudget> = new Map();"""

content = content.replace("""  private logger: Logger;
  private enabled: boolean = false;
  
  private mountedComponents: Set<string> = new Set();
  private imageHits = 0;
  private imageMisses = 0;
  private imageLoadTimes: number[] = [];""", new_state)

# Add setEnabled logic to start observer
set_enabled_old = """  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }"""
set_enabled_new = """  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (enabled && !this.observer && typeof PerformanceObserver !== 'undefined') {
      try {
        this.observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'longtask' && entry.duration > 50) {
              this.logger.warn(`Long task detected: ${entry.duration.toFixed(2)}ms`);
            }
          }
        });
        this.observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // unsupported
      }
      
      this.lastFpsTime = performance.now();
      const loop = () => {
        if (!this.enabled) return;
        this.frames++;
        const now = performance.now();
        if (now - this.lastFpsTime >= 1000) {
          this.currentFps = (this.frames * 1000) / (now - this.lastFpsTime);
          if (this.currentFps < 30) this.frameDrops++;
          this.frames = 0;
          this.lastFpsTime = now;
        }
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
  }"""
content = content.replace(set_enabled_old, set_enabled_new)

# Add budget validation
new_methods = """  public recordFocusLatency(ms: number) {
    if (!this.enabled) return;
    this.focusLatencies.push(ms);
    if (this.focusLatencies.length > 50) this.focusLatencies.shift();
  }

  public registerBudget(screenId: string, budget: RenderBudget) {
    this.activeBudgets.set(screenId, budget);
  }

  public validateBudget(screenId: string, actuals: { cards?: number, images?: number, renderTimeMs?: number }) {
    if (!this.enabled) return;
    const budget = this.activeBudgets.get(screenId);
    if (!budget) return;
    
    // In dev mode, log warnings if over budget
    if (actuals.cards && actuals.cards > budget.maxCards) {
      this.logger.warn(`[Budget Violation] ${screenId}: maxCards exceeded. Limit: ${budget.maxCards}, Actual: ${actuals.cards}`);
    }
    if (actuals.images && actuals.images > budget.maxImages) {
      this.logger.warn(`[Budget Violation] ${screenId}: maxImages exceeded. Limit: ${budget.maxImages}, Actual: ${actuals.images}`);
    }
    if (actuals.renderTimeMs && actuals.renderTimeMs > budget.maxRenderTimeMs) {
      this.logger.warn(`[Budget Violation] ${screenId}: maxRenderTimeMs exceeded. Limit: ${budget.maxRenderTimeMs}, Actual: ${actuals.renderTimeMs}`);
    }
    const memMB = (performance as any).memory ? Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024) : 0;
    if (memMB > budget.maxMemoryMB) {
      this.logger.warn(`[Budget Violation] ${screenId}: maxMemoryMB exceeded. Limit: ${budget.maxMemoryMB}, Actual: ${memMB}`);
    }
  }"""
  
content = content.replace("  public getSnapshot(): any {", new_methods + "\n\n  public getSnapshot(): any {")

# Update getSnapshot
snapshot_old = """    return {
      timestamp: Date.now(),
      mountedComponentCount: this.mountedComponents.size,
      imageCacheHitRate: hitRate,
      imageCacheMissRate: 1 - hitRate,
      estimatedMemoryUsageMB: (performance as any).memory ? Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024) : 0,
      imageLoadingTimeMs: avgLoadTime
    };"""
snapshot_new = """    const avgFocusLatency = this.focusLatencies.length > 0
      ? this.focusLatencies.reduce((a, b) => a + b, 0) / this.focusLatencies.length
      : 0;
      
    return {
      timestamp: Date.now(),
      fps: Math.round(this.currentFps),
      frameDrops: this.frameDrops,
      focusLatencyMs: Math.round(avgFocusLatency),
      mountedComponentCount: this.mountedComponents.size,
      imageCacheHitRate: hitRate,
      imageCacheMissRate: 1 - hitRate,
      estimatedMemoryUsageMB: (performance as any).memory ? Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024) : 0,
      imageLoadingTimeMs: avgLoadTime
    };"""
content = content.replace(snapshot_old, snapshot_new)

open('src/core/rendering/RenderMetrics.ts', 'w').write(content)
