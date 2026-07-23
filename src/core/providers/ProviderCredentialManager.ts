import { ProviderCredential } from './types';
import { StorageManager } from '../storage';

export class ProviderCredentialManager {
  private storage: StorageManager;
  private readonly STORAGE_KEY = 'provider_credentials';

  constructor(storage: StorageManager) {
    this.storage = storage;
  }

  public async getCredential(providerId: string, credentialId: string): Promise<ProviderCredential | null> {
    const all = await this.getAll();
    return all.find(c => c.id === `${providerId}_${credentialId}`) || null;
  }

  public async setCredential(providerId: string, credential: ProviderCredential): Promise<void> {
    const all = await this.getAll();
    const index = all.findIndex(c => c.id === `${providerId}_${credential.id}`);
    
    // Prefix the credential ID with the provider ID to keep them isolated
    const storedCred = { ...credential, id: `${providerId}_${credential.id}` };
    
    if (index >= 0) {
      all[index] = storedCred;
    } else {
      all.push(storedCred);
    }
    
    await this.storage.set(this.STORAGE_KEY, all);
  }

  private async getAll(): Promise<ProviderCredential[]> {
    return await this.storage.get<ProviderCredential[]>(this.STORAGE_KEY) || [];
  }
}
