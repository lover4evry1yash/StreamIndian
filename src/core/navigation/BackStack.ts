export interface BackStackEntry {
  type: 'route' | 'modal';
  id: string;
  data?: any;
}

export class BackStack {
  private stack: BackStackEntry[] = [];

  public push(entry: BackStackEntry): void {
    this.stack.push(entry);
  }

  public pop(): BackStackEntry | undefined {
    return this.stack.pop();
  }

  public replace(entry: BackStackEntry): void {
    this.stack.pop();
    this.stack.push(entry);
  }

  public clear(): void {
    this.stack = [];
  }

  public canGoBack(): boolean {
    return this.stack.length > 0;
  }
  
  public peek(): BackStackEntry | undefined {
    return this.stack[this.stack.length - 1];
  }
}
