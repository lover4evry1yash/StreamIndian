import re

content = open('src/core/navigation/FocusEngine.ts').read()

new_method = """  public getNeighbors(nodeId: string): { left?: string, right?: string, up?: string, down?: string } {
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
"""

content = content.replace("public handleKeyEvent(key: string): boolean {", new_method + "\n  public handleKeyEvent(key: string): boolean {")
open('src/core/navigation/FocusEngine.ts', 'w').write(content)
