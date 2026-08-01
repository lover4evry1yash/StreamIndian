import { describe, it } from 'node:test';
import { Bootstrap } from './Bootstrap';

describe('Bootstrap Profiling', () => {
  it('measures Bootstrap staged init times', async () => {
    (global as any).window = {
      addEventListener: () => {},
      removeEventListener: () => {}
    };
    (global as any).localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    };
    (global as any).document = {
      addEventListener: () => {},
      removeEventListener: () => {}
    };
    const t0 = performance.now();
    await Bootstrap.initializeCritical();
    const t1 = performance.now();
    await Bootstrap.initializeIdle();
    const t2 = performance.now();
    await Bootstrap.initializeOnDemand('search');
    const t3 = performance.now();
    await Bootstrap.initializeOnDemand('details');
    const t4 = performance.now();
    
    console.log(`[PROFILE] Critical: ${(t1 - t0).toFixed(2)}ms`);
    console.log(`[PROFILE] Idle: ${(t2 - t1).toFixed(2)}ms`);
    console.log(`[PROFILE] OnDemand Search: ${(t3 - t2).toFixed(2)}ms`);
    console.log(`[PROFILE] OnDemand Details: ${(t4 - t3).toFixed(2)}ms`);
    console.log(`[PROFILE] Total: ${(t4 - t0).toFixed(2)}ms`);
  });
});
