import { EventBus } from '../../EventBus';
import { Logger } from '../../Logger';
import { DebridManager } from './DebridManager';
import { TransferResult, TransferStatus } from './types';

export interface ActiveTransfer {
   infoHash: string;
   transferId: string;
   providerId: string;
   status: TransferStatus;
   lastPolled: number;
   pollIntervalMs: number;
   retryCount: number;
   title?: string;
}

export class TransferManager {
  private eventBus: EventBus;
  private logger: Logger;
  private debridManager: DebridManager;
  private activeTransfers: Map<string, ActiveTransfer> = new Map();
  private maxConcurrentTransfers = 3;
  private pollTimer: any = null;

  constructor(eventBus: EventBus, logger: Logger, debridManager: DebridManager) {
    this.eventBus = eventBus;
    this.logger = logger;
    this.debridManager = debridManager;
  }
  
  public startPolling() {
      if (this.pollTimer) return;
      this.pollTimer = setInterval(() => this.pollAllTransfers(), 3000);
  }
  
  public stopPolling() {
      if (this.pollTimer) {
          clearInterval(this.pollTimer);
          this.pollTimer = null;
      }
  }

  public async initiateTransfer(infoHash: string, magnet?: string, title?: string, preferredProvider?: string): Promise<TransferResult | null> {
    if (this.activeTransfers.has(infoHash)) {
       return {
          transferId: this.activeTransfers.get(infoHash)!.transferId,
          status: this.activeTransfers.get(infoHash)!.status.status,
          progress: this.activeTransfers.get(infoHash)!.status.progress
       };
    }
    
    // Limits check could happen here
    
    const { result, providerId } = await this.debridManager.createTransfer(infoHash, magnet, preferredProvider);
    
    if (result && providerId) {
        if (result.status === 'cached') {
            this.eventBus.emit('TRANSFER_COMPLETED', { infoHash, providerId });
            return result; // Done immediately
        }
        
        const initialStatus: TransferStatus = {
            transferId: result.transferId,
            status: result.status,
            progress: result.progress || 0
        };
        
        this.activeTransfers.set(infoHash, {
            infoHash,
            transferId: result.transferId,
            providerId,
            status: initialStatus,
            lastPolled: Date.now(),
            pollIntervalMs: 3000,
            retryCount: 0,
            title
        });
        
        this.startPolling();
        this.eventBus.emit('TRANSFER_STARTED', { infoHash, providerId, transferId: result.transferId, title });
        return result;
    }
    
    return null;
  }
  
  private async pollAllTransfers() {
      if (this.activeTransfers.size === 0) {
          this.stopPolling();
          return;
      }
      
      const now = Date.now();
      for (const [infoHash, transfer] of Array.from(this.activeTransfers.entries())) {
          if (now - transfer.lastPolled >= transfer.pollIntervalMs) {
              await this.pollTransfer(infoHash, transfer);
          }
      }
  }
  
  private async pollTransfer(infoHash: string, transfer: ActiveTransfer) {
      transfer.lastPolled = Date.now();
      
      try {
          const status = await this.debridManager.pollTransfer(transfer.transferId, transfer.providerId);
          if (status) {
              transfer.status = status;
              transfer.retryCount = 0;
              
              if (status.status === 'cached') {
                  this.activeTransfers.delete(infoHash);
                  this.eventBus.emit('TRANSFER_COMPLETED', { infoHash, providerId: transfer.providerId, status });
              } else if (status.status === 'error') {
                  this.activeTransfers.delete(infoHash);
                  this.eventBus.emit('TRANSFER_ERROR', { infoHash, providerId: transfer.providerId, status });
              } else {
                  this.eventBus.emit('TRANSFER_PROGRESS', { infoHash, providerId: transfer.providerId, status });
              }
          } else {
              this.handlePollError(infoHash, transfer);
          }
      } catch (err) {
          this.handlePollError(infoHash, transfer);
      }
  }
  
  private handlePollError(infoHash: string, transfer: ActiveTransfer) {
      transfer.retryCount++;
      // Exponential backoff
      transfer.pollIntervalMs = Math.min(30000, transfer.pollIntervalMs * 1.5);
      
      if (transfer.retryCount > 10) {
          this.activeTransfers.delete(infoHash);
          this.eventBus.emit('TRANSFER_ERROR', { infoHash, providerId: transfer.providerId, message: 'Max retries reached' });
      }
  }
}
