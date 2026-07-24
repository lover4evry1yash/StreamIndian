import re

content = open('src/core/navigation/FocusEngine.ts').read()

content = content.replace("import { FocusGroup } from './FocusGroup';", "import { FocusGroup } from './FocusGroup';\nimport { container } from '../ServiceContainer';\nimport { RenderMetrics } from '../rendering/RenderMetrics';")

old_setfocus = """  public setFocusedNode(nodeId: string, smoothScroll: boolean = true): void {
    const node = this.nodes.get(nodeId);
    if (!node) return;
    
    this.focusedNodeId = nodeId;"""

new_setfocus = """  public setFocusedNode(nodeId: string, smoothScroll: boolean = true): void {
    const startTime = performance.now();
    const node = this.nodes.get(nodeId);
    if (!node) return;
    
    this.focusedNodeId = nodeId;"""

content = content.replace(old_setfocus, new_setfocus)

old_endfocus = """    if (el) {
      el.scrollIntoView({ behavior: smoothScroll ? 'smooth' : 'auto', block: 'nearest', inline: 'center' });
      el.focus({ preventScroll: true });
    }
  }"""

new_endfocus = """    if (el) {
      el.scrollIntoView({ behavior: smoothScroll ? 'smooth' : 'auto', block: 'nearest', inline: 'center' });
      el.focus({ preventScroll: true });
    }
    
    const metrics = container.resolve<RenderMetrics>('RenderMetrics');
    if (metrics) {
      metrics.recordFocusLatency(performance.now() - startTime);
    }
  }"""

content = content.replace(old_endfocus, new_endfocus)
open('src/core/navigation/FocusEngine.ts', 'w').write(content)
