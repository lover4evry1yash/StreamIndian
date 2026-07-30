import { EventBus } from '../EventBus';
import { FocusGroup } from './FocusGroup';
import { container } from '../ServiceContainer';
import { RenderMetrics } from '../rendering/RenderMetrics';

export interface FocusNode {
  id: string;
  groupId: string;
  getElement: () => HTMLElement | null; // Lazy evaluation
  cachedRect?: DOMRect;
  onFocused?: () => void;
  onSelected?: () => void;
}

export class FocusEngine {
  private nodes: Map<string, FocusNode> = new Map();
  private groups: Map<string, FocusGroup> = new Map();
  private activeGroupId: string = 'root';
  private focusedNodeId: string | null = null;
  private focusStack: string[] = []; // Chronological history of focused node IDs
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.registerGroup('root', false);
  }

  public registerGroup(groupId: string, trapFocus: boolean): void {
    if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] [registerGroup] groupId='${groupId}', trapFocus=${trapFocus}`);
    if (!this.groups.has(groupId)) {
      this.groups.set(groupId, new FocusGroup(groupId, trapFocus));
    } else {
       this.groups.get(groupId)!.trapFocus = trapFocus;
    }
  }

  public unregisterGroup(groupId: string): void {
    if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] [unregisterGroup] groupId='${groupId}'`);
    this.groups.delete(groupId);
  }

  public getNodesForGroup(groupId: string): FocusNode[] {
    const group = this.groups.get(groupId);
    if (!group) return [];
    const result: FocusNode[] = [];
    for (const id of group.nodes) {
      const node = this.nodes.get(id);
      if (node) result.push(node);
    }
    return result;
  }

  public printGroupDiagnostics(groupId: string): void {
    const groupNodes = this.getNodesForGroup(groupId);
    const focusedNode = this.focusedNodeId ? this.nodes.get(this.focusedNodeId) : null;
    if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`================================================================`);
    if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] Group: ${groupId}`);
    if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] Registered nodes:`);
    if (groupNodes.length === 0) {
      if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG]   (None registered)`);
    } else {
      groupNodes.forEach(node => {
        const el = node.getElement();
        const mounted = el !== null;
        const domExists = el ? document.body.contains(el) : false;
        const rect = el ? el.getBoundingClientRect() : node.cachedRect;
        const rectStr = rect ? `l:${rect.left.toFixed(1)}, t:${rect.top.toFixed(1)}, r:${rect.right.toFixed(1)}, b:${rect.bottom.toFixed(1)}, w:${rect.width.toFixed(1)}, h:${rect.height.toFixed(1)}` : 'NULL';
        if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] - id: ${node.id}, group: ${node.groupId}, mounted: ${mounted}, DOM element exists: ${domExists}, DOMRect: { ${rectStr} }`);
      });
    }
    if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] Current active group: ${this.activeGroupId}`);
    if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] Current focused node: ${this.focusedNodeId}`);
    if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] Current focused node group: ${focusedNode ? focusedNode.groupId : 'NONE'}`);
    if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`================================================================`);
  }

  public registerNode(node: FocusNode): void {
    const el = node.getElement();
    if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] [registerNode] id='${node.id}', groupId='${node.groupId}', elementPresent=${el !== null}`);
    this.nodes.set(node.id, node);
    const group = this.groups.get(node.groupId) || new FocusGroup(node.groupId);
    this.groups.set(node.groupId, group);
    group.addNode(node.id);

    // Automatically focus the first registered node if nothing is focused
    if (!this.focusedNodeId) {
      this.setFocusedNode(node.id, false);
    }
  }

  public unregisterNode(nodeId: string): void {
    if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] [unregisterNode] id='${nodeId}'`);
    const node = this.nodes.get(nodeId);
    if (node) {
      const group = this.groups.get(node.groupId);
      if (group) group.removeNode(nodeId);
      this.nodes.delete(nodeId);

      // Remove from history stack
      this.focusStack = this.focusStack.filter(id => id !== nodeId);

      // If the currently focused node is removed, strictly restore focus
      if (this.focusedNodeId === nodeId) {
        this.focusedNodeId = null;
        this.restoreFocus();
      }
    }
  }

  private restoreFocus(): void {
    // Pop from stack until we find a node that is currently registered
    while (this.focusStack.length > 0) {
      const candidateId = this.focusStack[this.focusStack.length - 1];
      if (this.nodes.has(candidateId)) {
        this.setFocusedNode(candidateId, false); // Restore without smooth scroll
        return;
      } else {
        this.focusStack.pop();
      }
    }

    // Fallback: if stack is empty, find the first available node
    for (const [id, node] of this.nodes.entries()) {
      if (node.groupId === this.activeGroupId) {
         this.setFocusedNode(id, false);
         return;
      }
    }
    // Absolute fallback
    if (this.nodes.size > 0) {
      this.setFocusedNode(this.nodes.keys().next().value, false);
    }
  }

  public cacheCoordinates(): void {
    for (const node of this.nodes.values()) {
      const el = node.getElement();
      if (el) {
        node.cachedRect = el.getBoundingClientRect();
      } else {
        node.cachedRect = undefined;
      }
    }
  }

  public setFocusedNode(nodeId: string, smoothScroll: boolean = true): void {
    if (this.focusedNodeId === nodeId) {
       return;
    }
    const startTime = performance.now();
    const node = this.nodes.get(nodeId);
    if (!node) {
      if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] [setFocusedNode] ERROR: Node '${nodeId}' not found in registered nodes!`);
      return;
    }

    if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] [setFocusedNode] Setting focus to '${nodeId}' (group: '${node.groupId}')`);
    this.focusedNodeId = nodeId;
    const group = this.groups.get(node.groupId);
    if (group) {
      group.lastFocusedId = nodeId;
      this.activeGroupId = group.id;
    }

    this.focusStack = this.focusStack.filter(id => id !== nodeId);
    this.focusStack.push(nodeId);

    if (node.onFocused) node.onFocused();
    this.eventBus.emit('FOCUS_CHANGED', nodeId);

    const el = node.getElement();
    if (el) {
      if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] [setFocusedNode] Target Element found: ${el.tagName}#${el.id}.${el.className}`);

      // Search for nearest scrollable ancestor
      let ancestor: HTMLElement | null = el.parentElement;
      let scrollContainer: HTMLElement | null = null;
      while (ancestor) {
        const style = window.getComputedStyle(ancestor);
        const overflowY = style.overflowY;
        const overflowX = style.overflowX;
        if (['auto', 'scroll', 'overlay'].includes(overflowY) || ['auto', 'scroll', 'overlay'].includes(overflowX)) {
          scrollContainer = ancestor;
          break;
        }
        ancestor = ancestor.parentElement;
      }

      const containerDesc = scrollContainer
        ? `${scrollContainer.tagName}#${scrollContainer.id || 'noid'}.${scrollContainer.className}`
        : 'WINDOW/BODY';

      if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] [setFocusedNode] Scroll Container Selected: ${containerDesc}`);
      if (scrollContainer) {
        const style = window.getComputedStyle(scrollContainer);
        if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] [setFocusedNode] Scroll Container Overflow computed: overflowX=${style.overflowX}, overflowY=${style.overflowY}`);
      }

      const scrollTopBefore = scrollContainer ? scrollContainer.scrollTop : (window.scrollY || document.documentElement.scrollTop);
      const scrollLeftBefore = scrollContainer ? scrollContainer.scrollLeft : (window.scrollX || document.documentElement.scrollLeft);

      if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] [setFocusedNode] scrollTop BEFORE scrollIntoView: ${scrollTopBefore}`);
      if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] [setFocusedNode] scrollLeft BEFORE scrollIntoView: ${scrollLeftBefore}`);

      if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] [setFocusedNode] Executing el.scrollIntoView({ behavior: '${smoothScroll ? 'smooth' : 'auto'}', block: 'nearest', inline: 'center' }) on element ${el.id}...`);
      el.scrollIntoView({ behavior: smoothScroll ? 'smooth' : 'auto', block: 'nearest', inline: 'center' });
      el.focus({ preventScroll: true });

      const scrollTopAfterSync = scrollContainer ? scrollContainer.scrollTop : (window.scrollY || document.documentElement.scrollTop);
      const scrollLeftAfterSync = scrollContainer ? scrollContainer.scrollLeft : (window.scrollX || document.documentElement.scrollLeft);

      if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] [setFocusedNode] scrollTop AFTER scrollIntoView (Sync): ${scrollTopAfterSync}`);
      if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] [setFocusedNode] scrollLeft AFTER scrollIntoView (Sync): ${scrollLeftAfterSync}`);

      setTimeout(() => {
        const scrollTopAfterAsync = scrollContainer ? scrollContainer.scrollTop : (window.scrollY || document.documentElement.scrollTop);
        const scrollLeftAfterAsync = scrollContainer ? scrollContainer.scrollLeft : (window.scrollX || document.documentElement.scrollLeft);
        if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] [setFocusedNode] scrollTop AFTER scrollIntoView (Async 300ms): ${scrollTopAfterAsync}`);
        if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] [setFocusedNode] scrollLeft AFTER scrollIntoView (Async 300ms): ${scrollLeftAfterAsync}`);
      }, 300);
    } else {
      if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] [setFocusedNode] ERROR: Element for node '${nodeId}' NOT FOUND in DOM!`);
    }

    const metrics = container.resolve<RenderMetrics>('RenderMetrics');
    if (metrics) {
      metrics.recordFocusLatency(performance.now() - startTime);
    }
  }

  public getFocusedNodeId(): string | null {
    return this.focusedNodeId;
  }

  public setActiveGroup(groupId: string): void {
    const prevGroup = this.activeGroupId;
    const group = this.groups.get(groupId);
    if (group) {
      this.activeGroupId = groupId;
      if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] [setActiveGroup] Previous active group: '${prevGroup}', New active group: '${groupId}', Group Nodes count: ${group.nodes.size}`);
      if (group.lastFocusedId && this.nodes.has(group.lastFocusedId)) {
        this.setFocusedNode(group.lastFocusedId);
      } else {
        let focusedInGroup = false;
        for (const nodeId of group.nodes) {
          this.setFocusedNode(nodeId);
          focusedInGroup = true;
          break;
        }
        if (!focusedInGroup) {
          if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] [setActiveGroup] WARNING: Group '${groupId}' has NO registered nodes! Focused node remains '${this.focusedNodeId}'`);
        }
      }
      this.printGroupDiagnostics(groupId);
    } else {
      if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] [setActiveGroup] ERROR: Group '${groupId}' does not exist!`);
    }
  }

  public getActiveGroupId(): string {
     return this.activeGroupId;
  }

  public getNeighbors(nodeId: string): { left?: string, right?: string, up?: string, down?: string } {
     return {}; // Deprecated in favor of the new strict engine
  }

  public handleKeyEvent(key: string): boolean {
    if (key === 'KEY_ENTER') {
      if (this.focusedNodeId) {
        const node = this.nodes.get(this.focusedNodeId);
        if (node && node.onSelected) {
          if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] KEY_ENTER pressed on focused node: ${this.focusedNodeId}`);
          node.onSelected();
          return true;
        }
      }
      return false;
    }

    if (!['KEY_UP', 'KEY_DOWN', 'KEY_LEFT', 'KEY_RIGHT'].includes(key)) {
      return false;
    }

    if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`================================================================`);
    if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] >>> KEY EVENT RECEIVED: ${key} <<<`);
    if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] Current Focused Node ID: ${this.focusedNodeId}`);
    if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] Active Group ID: ${this.activeGroupId}`);

    if (!this.focusedNodeId) {
      if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] ERROR: No node currently focused!`);
      return false;
    }

    this.cacheCoordinates();
    const currentNode = this.nodes.get(this.focusedNodeId);
    if (!currentNode || !currentNode.cachedRect) {
      if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] ERROR: Current node ${this.focusedNodeId} not registered or has no cachedRect!`);
      return false;
    }

    const currentRect = currentNode.cachedRect;
    const currentEl = currentNode.getElement();
    if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] Current Focused Node Group: ${currentNode.groupId}`);
    if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] Current Focused Node Element: ${currentEl ? `${currentEl.tagName}#${currentEl.id}.${currentEl.className}` : 'NULL'}`);
    if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] Current Focused Node DOMRect: { left: ${currentRect.left.toFixed(1)}, top: ${currentRect.top.toFixed(1)}, right: ${currentRect.right.toFixed(1)}, bottom: ${currentRect.bottom.toFixed(1)}, width: ${currentRect.width.toFixed(1)}, height: ${currentRect.height.toFixed(1)} }`);

    const currentCenter = {
      x: currentRect.left + currentRect.width / 2,
      y: currentRect.top + currentRect.height / 2,
    };

    const activeGroup = this.groups.get(this.activeGroupId);
    const trapFocus = activeGroup?.trapFocus || false;
    if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] TrapFocus for active group '${this.activeGroupId}': ${trapFocus}`);

    interface Candidate {
       id: string;
       groupId: string;
       rect: DOMRect;
       dx: number;
       dy: number;
       dist: number;
       vertOverlap: number;
       horizOverlap: number;
    }

    const candidates: Candidate[] = [];
    if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] Scanning ${this.nodes.size} total registered focus nodes...`);

    for (const [id, node] of this.nodes.entries()) {
      if (id === this.focusedNodeId) continue;
      if (!node.cachedRect || node.cachedRect.width === 0 || node.cachedRect.height === 0) {
         continue;
      }
      if (trapFocus && node.groupId !== this.activeGroupId) {
         continue;
      }

      const rect = node.cachedRect;
      const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      const dx = center.x - currentCenter.x;
      const dy = center.y - currentCenter.y;

      const vertOverlap = Math.max(0, Math.min(currentRect.bottom, rect.bottom) - Math.max(currentRect.top, rect.top));
      const horizOverlap = Math.max(0, Math.min(currentRect.right, rect.right) - Math.max(currentRect.left, rect.left));

      candidates.push({ id, groupId: node.groupId, rect, dx, dy, dist: Math.sqrt(dx*dx + dy*dy), vertOverlap, horizOverlap });
    }

    if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] Valid Candidates count: ${candidates.length}`);
    candidates.forEach((c) => {
      if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] Candidate [${c.id}] (grp: ${c.groupId}): dx=${c.dx.toFixed(1)}, dy=${c.dy.toFixed(1)}, vOverlap=${c.vertOverlap.toFixed(1)}, hOverlap=${c.horizOverlap.toFixed(1)}, dist=${c.dist.toFixed(1)}, rect={l:${c.rect.left.toFixed(1)}, t:${c.rect.top.toFixed(1)}, r:${c.rect.right.toFixed(1)}, b:${c.rect.bottom.toFixed(1)}}`);
    });

    let bestCandidateId: string | null = null;

    if (key === 'KEY_RIGHT') {
       const rightCands = candidates.filter(c => c.dx > 5 && c.vertOverlap > 0);
       if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] KEY_RIGHT -> matching rightCands (dx > 5 && vertOverlap > 0): [${rightCands.map(c => c.id).join(', ')}]`);
       if (rightCands.length > 0) {
           bestCandidateId = rightCands.reduce((prev, curr) => curr.dx < prev.dx ? curr : prev).id;
       } else if (currentCenter.x < 300) {
           const fallbackCands = candidates.filter(c => c.dx > 5);
           if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] KEY_RIGHT -> fallbackCands (sidebar exit): [${fallbackCands.map(c => c.id).join(', ')}]`);
           if (fallbackCands.length > 0) {
               bestCandidateId = fallbackCands.reduce((prev, curr) => curr.dist < prev.dist ? curr : prev).id;
           }
       }
    } else if (key === 'KEY_LEFT') {
       const leftCands = candidates.filter(c => c.dx < -5 && c.vertOverlap > 0);
       if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] KEY_LEFT -> matching leftCands (dx < -5 && vertOverlap > 0): [${leftCands.map(c => c.id).join(', ')}]`);
       if (leftCands.length > 0) {
           bestCandidateId = leftCands.reduce((prev, curr) => Math.abs(curr.dx) < Math.abs(prev.dx) ? curr : prev).id;
       } else {
           const fallbackCands = candidates.filter(c => c.dx < -5);
           if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] KEY_LEFT -> fallbackCands (sidebar jump): [${fallbackCands.map(c => c.id).join(', ')}]`);
           if (fallbackCands.length > 0) {
               bestCandidateId = fallbackCands.reduce((prev, curr) => curr.dist < prev.dist ? curr : prev).id;
           }
       }
    } else if (key === 'KEY_DOWN') {
       const downCands = candidates.filter(c => c.dy > 5);
       const overlapCands = downCands.filter(c => c.horizOverlap > 0);
       if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] KEY_DOWN -> downCands: [${downCands.map(c => c.id).join(', ')}], horizOverlapCands: [${overlapCands.map(c => c.id).join(', ')}]`);
       if (overlapCands.length > 0) {
           bestCandidateId = overlapCands.reduce((prev, curr) => {
               if (Math.abs(curr.dy - prev.dy) < 10) {
                   return Math.abs(curr.dx) < Math.abs(prev.dx) ? curr : prev;
               }
               return curr.dy < prev.dy ? curr : prev;
           }).id;
       } else {
           if (downCands.length > 0) {
               bestCandidateId = downCands.reduce((prev, curr) => curr.dist < prev.dist ? curr : prev).id;
           }
       }
    } else if (key === 'KEY_UP') {
       const upCands = candidates.filter(c => c.dy < -5);
       const overlapCands = upCands.filter(c => c.horizOverlap > 0);
       if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] KEY_UP -> upCands: [${upCands.map(c => c.id).join(', ')}], horizOverlapCands: [${overlapCands.map(c => c.id).join(', ')}]`);
       if (overlapCands.length > 0) {
           bestCandidateId = overlapCands.reduce((prev, curr) => {
               if (Math.abs(curr.dy - prev.dy) < 10) {
                   return Math.abs(curr.dx) < Math.abs(prev.dx) ? curr : prev;
               }
               return Math.abs(curr.dy) < Math.abs(prev.dy) ? curr : prev;
           }).id;
       } else {
           if (upCands.length > 0) {
               bestCandidateId = upCands.reduce((prev, curr) => curr.dist < prev.dist ? curr : prev).id;
           }
       }
    }

    if (bestCandidateId) {
      const bestNode = this.nodes.get(bestCandidateId);
      if (bestNode && bestNode.groupId !== currentNode.groupId) {
        const targetGroup = this.groups.get(bestNode.groupId);
        if (targetGroup && targetGroup.lastFocusedId && this.nodes.has(targetGroup.lastFocusedId)) {
           if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] Restoring lastFocusedId '${targetGroup.lastFocusedId}' for group transition '${currentNode.groupId}' -> '${bestNode.groupId}'`);
           bestCandidateId = targetGroup.lastFocusedId;
        }
      }
      const targetNode = this.nodes.get(bestCandidateId)!;
      const targetEl = targetNode.getElement();
      const targetRect = targetNode.cachedRect;

      if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] >>> DESTINATION NODE SELECTED: id=${bestCandidateId}, group=${targetNode.groupId} <<<`);
      if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] Destination Element: ${targetEl ? `${targetEl.tagName}#${targetEl.id}.${targetEl.className}` : 'NULL'}`);
      if (targetRect) {
        if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] Destination DOMRect: { left: ${targetRect.left.toFixed(1)}, top: ${targetRect.top.toFixed(1)}, right: ${targetRect.right.toFixed(1)}, bottom: ${targetRect.bottom.toFixed(1)}, width: ${targetRect.width.toFixed(1)}, height: ${targetRect.height.toFixed(1)} }`);
      }
      this.setFocusedNode(bestCandidateId);
      return true;
    } else {
      if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] >>> NO DESTINATION CANDIDATE FOUND FOR KEY: ${key} <<<`);
    }

    return false;
  }
}
