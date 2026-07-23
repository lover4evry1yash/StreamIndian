import { NetworkClient } from '../../NetworkClient';
import { CacheManager } from '../../storage/CacheManager';
import { CachePolicyType } from '../../storage/types';
import { Logger } from '../../Logger';

const BASE_URL = 'https://graphql.anilist.co';

export class AniListClient {
  private network: NetworkClient;
  private cache: CacheManager;
  private logger: Logger;
  private lastRequestTime: number = 0;
  
  public metrics = {
    requests: 0,
    rateLimitsHit: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalLatencyMs: 0
  };
  
  constructor(network: NetworkClient, cache: CacheManager, logger: Logger) {
    this.network = network;
    this.cache = cache;
    this.logger = logger;
  }

  private async rateLimitDelay() {
    const now = Date.now();
    const timeSinceLast = now - this.lastRequestTime;
    if (timeSinceLast < 1200) { // Max ~90 requests per minute limit for AniList
      await new Promise(r => setTimeout(r, 1200 - timeSinceLast));
    }
    this.lastRequestTime = Date.now();
  }

  private async graphqlQuery<T>(query: string, variables: any = {}, retries = 3): Promise<T> {
    await this.rateLimitDelay();

    try {
      this.metrics.requests++;
      const start = Date.now();
      
      const res = await this.network.fetch(BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ query, variables })
      });
      
      const result: any = await res.json();
      this.metrics.totalLatencyMs += (Date.now() - start);

      if (result.errors) {
         throw new Error(`GraphQL Error: ${result.errors[0].message}`);
      }

      return result.data as T;
    } catch (error: any) {
      throw error;
    }
  }

  public async getAnimeById(id: number): Promise<any> {
    const cacheKey = `anilist_anime_${id}`;
    const cached = await this.cache.get(cacheKey, String(id), CachePolicyType.METADATA);
    if (cached) {
      this.metrics.cacheHits++;
      return cached;
    }
    this.metrics.cacheMisses++;

    const query = `
      query ($id: Int) {
        Media (id: $id, type: ANIME) {
          id
          idMal
          title {
            romaji
            english
            native
          }
          format
          status
          description
          season
          seasonYear
          episodes
          source
          isAdult
          averageScore
          popularity
          genres
          tags {
            name
          }
          coverImage {
            extraLarge
            large
            medium
            color
          }
          bannerImage
          studios(isMain: true) {
            nodes {
              id
              name
            }
          }
          characters(sort: ROLE, page: 1, perPage: 10) {
            edges {
              role
              node {
                id
                name {
                  full
                }
                image {
                  large
                }
              }
              voiceActors(language: JAPANESE, sort: RELEVANCE) {
                id
                name {
                  full
                }
                image {
                  large
                }
              }
            }
          }
          relations {
            edges {
              relationType
              node {
                id
                type
                title {
                  romaji
                }
              }
            }
          }
        }
      }
    `;

    const data = await this.graphqlQuery<any>(query, { id });
    const media = data?.Media;
    if (media) {
      await this.cache.set(cacheKey, String(id), media, CachePolicyType.METADATA);
    }
    return media;
  }
}
