import { IProvider } from '../../providers/types';

export interface IDebridProvider extends IProvider {
  checkCache(infoHashes: string[]): Promise<Record<string, boolean>>;
  createTransfer(infoHash: string, magnet?: string): Promise<TransferResult>;
  pollTransfer(transferId: string): Promise<TransferStatus>;
  resolve(infoHash: string, fileIndex?: number): Promise<string | null>;
  cancel(transferId: string): Promise<boolean>;
  
  getLimits(): DebridLimits;
  getDiagnostics(): DebridDiagnostics;
}

export interface DebridProviderHealth {
  isAvailable: boolean;
  latencyMs: number;
  reliability: number;
  failureCount: number;
  lastSuccessfulOperation?: number;
  averageResolveTimeMs: number;
  averageTransferTimeMs: number;
}

export interface TransferResult {
  transferId: string;
  status: 'cached' | 'downloading' | 'queued' | 'error';
  progress?: number; // 0-100
}

export interface TransferStatus {
  transferId: string;
  status: 'cached' | 'downloading' | 'queued' | 'error';
  progress: number; // 0-100
  downloadSpeed?: number; // bytes per second
  timeRemaining?: number; // seconds
}

export interface DebridLimits {
  concurrentTransfers: number;
  maxFileSize: number; // bytes
}

export interface DebridDiagnostics {
  id: string;
  name: string;
  health: DebridProviderHealth;
  totalResolutions: number;
  cacheHitRate: number;
}
