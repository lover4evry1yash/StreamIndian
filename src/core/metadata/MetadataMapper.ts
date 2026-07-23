/**
 * Generic mapping interface for normalizing provider-specific responses
 * into canonical domain models.
 * Future providers will implement this interface.
 */
export interface MetadataMapper<TProvider, TDomain> {
  map(source: TProvider): TDomain;
}
