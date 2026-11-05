import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Bootstrap } from './Bootstrap';
import { container } from './ServiceContainer';

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
    try {
      await Promise.all([Bootstrap.initializeCritical(), Bootstrap.initializeCritical()]);
      assert.ok(container.resolve('Config'));
      assert.ok(container.resolve('EventBus'));
      assert.ok(container.resolve('PlaybackManager'));
      const eventBus = container.resolve('EventBus');
      await Promise.all([Bootstrap.initializeCritical(), Bootstrap.initializeCritical()]);
      assert.strictEqual(container.resolve('EventBus'), eventBus);
      await Bootstrap.initializeIdle();
      await Bootstrap.initializeOnDemand('search');
      await Bootstrap.initializeOnDemand('details');
      assert.ok(container.resolve('SearchViewModel'));
      assert.ok(container.resolve('MediaDetailsViewModel'));
      assert.ok(container.resolve('StreamViewModel'));
    } finally {
      await Bootstrap.shutdown();
    }
    assert.throws(() => container.resolve('Config'), /not found/);
  });
});
