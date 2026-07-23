export interface ScheduleOptions {
  priority?: number;
  timeoutMs?: number;
  abortSignal?: AbortSignal;
}

interface ScheduledTask<T> {
  id: string;
  execute: () => Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
  options: ScheduleOptions;
  enqueuedAt: number;
}

export class RequestScheduler {
  private queue: ScheduledTask<any>[] = [];
  private activeCount: number = 0;
  private maxConcurrent: number;

  constructor(maxConcurrent: number = 5) {
    this.maxConcurrent = maxConcurrent;
  }

  public schedule<T>(execute: () => Promise<T>, options: ScheduleOptions = {}): Promise<T> {
    return new Promise((resolve, reject) => {
      const task: ScheduledTask<T> = {
        id: Math.random().toString(36).substring(7),
        execute,
        resolve,
        reject,
        options,
        enqueuedAt: Date.now(),
      };

      this.queue.push(task);
      this.sortQueue();
      this.processNext();
    });
  }

  private sortQueue(): void {
    this.queue.sort((a, b) => {
      const pA = a.options.priority || 0;
      const pB = b.options.priority || 0;
      if (pA !== pB) return pB - pA; // Higher priority first
      return a.enqueuedAt - b.enqueuedAt; // FIFO for same priority
    });
  }

  private processNext(): void {
    if (this.activeCount >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const task = this.queue.shift();
    if (!task) return;

    if (task.options.abortSignal?.aborted) {
      task.reject(new Error('Aborted'));
      this.processNext();
      return;
    }

    this.activeCount++;

    let timeoutId: any;
    let isFinished = false;

    const finish = () => {
      if (isFinished) return;
      isFinished = true;
      clearTimeout(timeoutId);
      this.activeCount--;
      this.processNext();
    };

    if (task.options.timeoutMs) {
      timeoutId = setTimeout(() => {
        if (!isFinished) {
          task.reject(new Error('Timeout'));
          finish();
        }
      }, task.options.timeoutMs);
    }

    if (task.options.abortSignal) {
      task.options.abortSignal.addEventListener('abort', () => {
        if (!isFinished) {
          task.reject(new Error('Aborted'));
          finish();
        }
      });
    }

    task.execute()
      .then(result => {
        if (!isFinished) {
          task.resolve(result);
          finish();
        }
      })
      .catch(err => {
        if (!isFinished) {
          task.reject(err);
          finish();
        }
      });
  }
}
