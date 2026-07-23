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
  }

  public unregisterNode(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      const group = this.groups.get(node.groupId);
      if (group) group.removeNode(nodeId);
      this.nodes.delete(nodeId);
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
    const neighbors: { left?: string, right?: string, up?: string, down?: string } = {};
    const node = this.nodes.get(nodeId);
    if (!node) return neighbors;
    
    this.cacheCoordinates();
    if (!node.cachedRect) return neighbors;
    
    const currentRect = node.cachedRect;
    const currentCenter = {
      x: currentRect.left + currentRect.width / 2,
      y: currentRect.top + currentRect.height / 2,
    };
    
    let minDists = { left: Infinity, right: Infinity, up: Infinity, down: Infinity };

    for (const [id, candidate] of this.nodes.entries()) {
      if (id === nodeId) continue;
      if (!candidate.cachedRect) continue;
      if (candidate.cachedRect.width === 0 || candidate.cachedRect.height === 0) continue;
      
      const rect = candidate.cachedRect;
      const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      const dx = center.x - currentCenter.x;
      const dy = center.y - currentCenter.y;
      
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dx < -5 && Math.abs(dy) <= Math.abs(dx) * 1.5 && dist < minDists.left) {
        minDists.left = dist;
        neighbors.left = id;
      }
      if (dx > 5 && Math.abs(dy) <= Math.abs(dx) * 1.5 && dist < minDists.right) {
        minDists.right = dist;
        neighbors.right = id;
      }
      if (dy < -5 && Math.abs(dx) <= Math.abs(dy) * 1.5 && dist < minDists.up) {
        minDists.up = dist;
        neighbors.up = id;
      }
      if (dy > 5 && Math.abs(dx) <= Math.abs(dy) * 1.5 && dist < minDists.down) {
        minDists.down = dist;
        neighbors.down = id;
      }
    }
    
    return neighbors;
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

    let bestCandidateId: string | null = null;
    let minDistance = Infinity;

    const activeGroup = this.groups.get(this.activeGroupId);
    const trapFocus = activeGroup?.trapFocus || false;

    for (const [id, node] of this.nodes.entries()) {
      if (id === this.focusedNodeId) continue;
      if (!node.cachedRect) continue;
      if (node.cachedRect.width === 0 || node.cachedRect.height === 0) continue; 

      if (trapFocus && node.groupId !== this.activeGroupId) {
        continue;
      }

      const rect = node.cachedRect;
      const center = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };

      const dx = center.x - currentCenter.x;
      const dy = center.y - currentCenter.y;

      let isCandidate = false;

      switch (key) {
        case 'KEY_LEFT':
          isCandidate = dx < -5 && Math.abs(dy) <= Math.abs(dx) * 1.5;
          break;
        case 'KEY_RIGHT':
          isCandidate = dx > 5 && Math.abs(dy) <= Math.abs(dx) * 1.5;
          break;
        case 'KEY_UP':
          isCandidate = dy < -5 && Math.abs(dx) <= Math.abs(dy) * 1.5;
          break;
        case 'KEY_DOWN':
          isCandidate = dy > 5 && Math.abs(dx) <= Math.abs(dy) * 1.5;
          break;
      }

      if (isCandidate) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDistance) {
          minDistance = dist;
          bestCandidateId = id;
        }
      }
    }

    if (bestCandidateId) {
      this.setFocusedNode(bestCandidateId);
      return true;
    }

    return false;
  }
}
