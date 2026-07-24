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
    if (!this.groups.has(groupId)) {
      this.groups.set(groupId, new FocusGroup(groupId, trapFocus));
    } else {
       this.groups.get(groupId)!.trapFocus = trapFocus;
    }
  }

  public registerNode(node: FocusNode): void {
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
    const startTime = performance.now();
    const node = this.nodes.get(nodeId);
    if (!node) return;
    
    this.focusedNodeId = nodeId;
    const group = this.groups.get(node.groupId);
    if (group) {
      group.lastFocusedId = nodeId;
      this.activeGroupId = group.id;
    }
    
    // Push to chronological stack, maintaining order
    this.focusStack = this.focusStack.filter(id => id !== nodeId);
    this.focusStack.push(nodeId);
    
    if (node.onFocused) node.onFocused();
    this.eventBus.emit('FOCUS_CHANGED', nodeId);
    
    const el = node.getElement();
    if (el) {
      el.scrollIntoView({ behavior: smoothScroll ? 'smooth' : 'auto', block: 'nearest', inline: 'center' });
      el.focus({ preventScroll: true });
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
    const group = this.groups.get(groupId);
    if (group) {
      this.activeGroupId = groupId;
      if (group.lastFocusedId && this.nodes.has(group.lastFocusedId)) {
        this.setFocusedNode(group.lastFocusedId);
      } else {
        for (const nodeId of group.nodes) {
          this.setFocusedNode(nodeId);
          break;
        }
      }
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
          node.onSelected();
          return true;
        }
      }
      return false;
    }
    
    if (!['KEY_UP', 'KEY_DOWN', 'KEY_LEFT', 'KEY_RIGHT'].includes(key)) {
      return false;
    }
    
    if (!this.focusedNodeId) return false;
    
    this.cacheCoordinates();
    const currentNode = this.nodes.get(this.focusedNodeId);
    if (!currentNode || !currentNode.cachedRect) return false;
    
    const currentRect = currentNode.cachedRect;
    const currentCenter = {
      x: currentRect.left + currentRect.width / 2,
      y: currentRect.top + currentRect.height / 2,
    };
    
    const activeGroup = this.groups.get(this.activeGroupId);
    const trapFocus = activeGroup?.trapFocus || false;
    
    interface Candidate {
       id: string;
       rect: DOMRect;
       dx: number;
       dy: number;
       dist: number;
       vertOverlap: number;
       horizOverlap: number;
    }
    
    const candidates: Candidate[] = [];

    for (const [id, node] of this.nodes.entries()) {
      if (id === this.focusedNodeId) continue;
      if (!node.cachedRect || node.cachedRect.width === 0 || node.cachedRect.height === 0) continue;
      
      if (trapFocus && node.groupId !== this.activeGroupId) continue;
      
      const rect = node.cachedRect;
      const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      const dx = center.x - currentCenter.x;
      const dy = center.y - currentCenter.y;
      
      const vertOverlap = Math.max(0, Math.min(currentRect.bottom, rect.bottom) - Math.max(currentRect.top, rect.top));
      const horizOverlap = Math.max(0, Math.min(currentRect.right, rect.right) - Math.max(currentRect.left, rect.left));
      
      candidates.push({ id, rect, dx, dy, dist: Math.sqrt(dx*dx + dy*dy), vertOverlap, horizOverlap });
    }
    
    let bestCandidateId: string | null = null;
    
    if (key === 'KEY_RIGHT') {
       const rightCands = candidates.filter(c => c.dx > 5 && c.vertOverlap > 0);
       if (rightCands.length > 0) {
           bestCandidateId = rightCands.reduce((prev, curr) => curr.dx < prev.dx ? curr : prev).id;
       } else if (currentCenter.x < 300) { 
           // Allow leaving sidebar to content
           const fallbackCands = candidates.filter(c => c.dx > 5);
           if (fallbackCands.length > 0) {
               bestCandidateId = fallbackCands.reduce((prev, curr) => curr.dist < prev.dist ? curr : prev).id;
           }
       }
    } else if (key === 'KEY_LEFT') {
       const leftCands = candidates.filter(c => c.dx < -5 && c.vertOverlap > 0);
       if (leftCands.length > 0) {
           bestCandidateId = leftCands.reduce((prev, curr) => Math.abs(curr.dx) < Math.abs(prev.dx) ? curr : prev).id;
       } else {
           // Allow jumping to sidebar from the first card
           const fallbackCands = candidates.filter(c => c.dx < -5);
           if (fallbackCands.length > 0) {
               bestCandidateId = fallbackCands.reduce((prev, curr) => curr.dist < prev.dist ? curr : prev).id;
           }
       }
    } else if (key === 'KEY_DOWN') {
       const downCands = candidates.filter(c => c.dy > 5);
       const overlapCands = downCands.filter(c => c.horizOverlap > 0);
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
      
      // If we are jumping to a different group (e.g. Content -> Sidebar, or Sidebar -> Content)
      if (bestNode && bestNode.groupId !== currentNode.groupId) {
        const targetGroup = this.groups.get(bestNode.groupId);
        // Restore previous focus within that target group if it exists
        if (targetGroup && targetGroup.lastFocusedId && this.nodes.has(targetGroup.lastFocusedId)) {
           bestCandidateId = targetGroup.lastFocusedId;
        }
      }

      this.setFocusedNode(bestCandidateId);
      return true;
    }
    
    return false;
  }
}
