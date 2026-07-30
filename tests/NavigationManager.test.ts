import test from 'node:test';
import assert from 'node:assert';
import { EventBus } from '../src/core/EventBus';
import { AppLifecycle } from '../src/core/AppLifecycle';
import { NavigationManager } from '../src/core/navigation/NavigationManager';
import { container } from '../src/core/ServiceContainer';

// Mock window and document
globalThis.window = {
  innerWidth: 1920,
  innerHeight: 1080,
  scrollY: 0,
  scrollX: 0,
  getComputedStyle: () => ({ overflowX: 'visible', overflowY: 'visible' })
} as any;

globalThis.document = {
  documentElement: { scrollTop: 0, scrollLeft: 0 }, body: { contains: () => true }
} as any;

// Mock RenderMetrics
container.register('RenderMetrics', {
  recordFocusChange: () => {}, recordFocusLatency: () => {}
});

test('NavigationManager and BackStack focus restoration', async (t) => {
  const eventBus = new EventBus();
  const lifecycle = new AppLifecycle(eventBus);
  const nav = new NavigationManager(eventBus, lifecycle);
  
  // Fake focus nodes
  nav.focusEngine.registerGroup('main', false);
  nav.focusEngine.registerGroup('modal-1', false);
  
  let focusedId = '';
  eventBus.on('FOCUS_CHANGED', (id) => {
    if (id) focusedId = id;
  });
  
  const mockElement = {
    getBoundingClientRect: () => ({ left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100 }),
    scrollIntoView: () => {},
    focus: () => {}
  } as any;
  
  nav.focusEngine.registerNode({
    id: 'item-1',
    groupId: 'main',
    getElement: () => mockElement
  });
  nav.focusEngine.registerNode({
    id: 'item-2',
    groupId: 'main',
    getElement: () => mockElement
  });
  
  nav.openRoute('nav-home', undefined, false); // Initial route
  
  // Set initial focus
  nav.focusEngine.setFocusedNode('item-1');
  assert.strictEqual(nav.focusEngine.getFocusedNodeId(), 'item-1');
  
  // Navigate to a new route
  nav.openRoute('nav-movies');
  assert.strictEqual(nav.router.getCurrentRoute()?.id, 'nav-movies');
  
  // Change focus in the new route
  nav.focusEngine.setFocusedNode('item-2');
  assert.strictEqual(nav.focusEngine.getFocusedNodeId(), 'item-2');
  
  // Open a modal
  nav.openModal('media-details', { mediaId: '123' });
  assert.strictEqual(nav.modalManager.isModalOpen('media-details'), true);
  
  // The backstack should now have two entries (nav-home -> nav-movies) + modal
  const peek1 = nav.backStack.peek();
  assert.strictEqual(peek1?.type, 'modal');
  assert.strictEqual(peek1?.focusedId, 'item-2');
  
  // Close the modal
  nav.handleBack();
  assert.strictEqual(nav.modalManager.isModalOpen('media-details'), false);
  
  // focus restore uses a setTimeout of 50ms, so we wait
  await new Promise(r => setTimeout(r, 60));
  assert.strictEqual(nav.focusEngine.getFocusedNodeId(), 'item-2');
  
  // Go back to initial route
  nav.handleBack();
  assert.strictEqual(nav.router.getCurrentRoute()?.id, 'nav-home'); 
  
  await new Promise(r => setTimeout(r, 60));
  assert.strictEqual(nav.focusEngine.getFocusedNodeId(), 'item-1'); // item-1 was focused before nav-movies
});
