import re

# Update TraktProvider
trakt = open('src/core/providers/trakt/TraktProvider.ts').read()
trakt = trakt.replace("export class TraktProvider implements IPersonalizationProvider {", "import { IRatingsProvider } from '../types';\nimport { Rating } from '../../models/DomainModels';\nexport class TraktProvider implements IPersonalizationProvider, IRatingsProvider {")

new_trakt_methods = """  public async getRatings(mediaId: string, type: 'movie' | 'series', externalIds?: Record<string, string>): Promise<Rating[]> {
    if (!this.client) throw new Error('TraktProvider not initialized');
    // Implement ratings fetching via client if needed
    // Placeholder for now
    return [{ provider: 'trakt', score: 8.5 }];
  }
"""
trakt = trakt.replace("  public getDiagnostics() {", new_trakt_methods + "\n  public getDiagnostics() {")
open('src/core/providers/trakt/TraktProvider.ts', 'w').write(trakt)


# Update MDBListProvider
mdblist = open('src/core/providers/mdblist/MDBListProvider.ts').read()
mdblist = mdblist.replace("export class MDBListProvider implements ICollectionProvider {", "import { IRatingsProvider } from '../types';\nimport { Rating } from '../../models/DomainModels';\nexport class MDBListProvider implements ICollectionProvider, IRatingsProvider {")

new_mdblist_methods = """  public async getRatings(mediaId: string, type: 'movie' | 'series', externalIds?: Record<string, string>): Promise<Rating[]> {
    if (!this.client) throw new Error('MDBListProvider not initialized');
    // Implement ratings fetching via client if needed
    // Placeholder for now
    return [{ provider: 'mdblist', score: 8.0 }];
  }
"""
mdblist = mdblist.replace("  public getDiagnostics() {", new_mdblist_methods + "\n  public getDiagnostics() {")
open('src/core/providers/mdblist/MDBListProvider.ts', 'w').write(mdblist)
