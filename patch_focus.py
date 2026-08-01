import sys

with open('src/core/navigation/FocusEngine.ts', 'r') as f:
    content = f.read()

# 1. Update cacheCoordinates
content = content.replace(
"""    for (const node of this.nodes.values()) {
      const el = node.getElement();
      if (el) {""",
"""    for (const node of this.nodes.values()) {
      if (trapFocusGroup && node.groupId !== trapFocusGroup) {
        node.cachedRect = undefined;
        continue;
      }
      const el = node.getElement();
      if (el) {""")

# 2. Update handleKeyDown
content = content.replace(
"""    this.cacheCoordinates();
    const currentNode = this.nodes.get(this.focusedNodeId);""",
"""    const activeGroup = this.groups.get(this.activeGroupId);
    const trapFocus = activeGroup?.trapFocus || false;
    this.cacheCoordinates(trapFocus ? this.activeGroupId : undefined);
    const currentNode = this.nodes.get(this.focusedNodeId);""")

content = content.replace(
"""    const activeGroup = this.groups.get(this.activeGroupId);
    const trapFocus = activeGroup?.trapFocus || false;
    if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] TrapFocus for active group '${this.activeGroupId}': ${trapFocus}`);""",
"""    if (((typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ? false : (import.meta as any).env?.DEV)) console.log(`[NAV_LOG] TrapFocus for active group '${this.activeGroupId}': ${trapFocus}`);""")

with open('src/core/navigation/FocusEngine.ts', 'w') as f:
    f.write(content)
