export class FocusGroup {
  public id: string;
  public trapFocus: boolean;
  public lastFocusedId: string | null = null;
  public nodes: Set<string> = new Set();

  constructor(id: string, trapFocus: boolean = false) {
    this.id = id;
    this.trapFocus = trapFocus;
  }

  public addNode(nodeId: string): void {
    this.nodes.add(nodeId);
  }

  public removeNode(nodeId: string): void {
    this.nodes.delete(nodeId);
    if (this.lastFocusedId === nodeId) {
      this.lastFocusedId = null;
    }
  }
  
  public hasNode(nodeId: string): boolean {
    return this.nodes.has(nodeId);
  }
}
