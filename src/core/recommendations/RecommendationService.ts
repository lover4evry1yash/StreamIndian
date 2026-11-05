import type { MediaItem } from '../../types/tizen';

export interface RecommendationSignals {
  history: MediaItem[];
  favorites?: MediaItem[];
  preferredLanguages?: string[];
  preferredTypes?: MediaItem['mediaType'][];
}

export interface RecommendationStrategy {
  id: string;
  weight: number;
  personalized: boolean;
  score(candidate: MediaItem, signals: RecommendationSignals): number;
}

export interface RecommendationServiceOptions {
  strategies?: RecommendationStrategy[];
  limit?: number;
}

const normalized = (value: string) => value.trim().toLocaleLowerCase();

function createDefaultStrategies(): RecommendationStrategy[] {
  return [
    {
      id: 'genre-affinity',
      weight: 5,
      personalized: true,
      score(candidate, signals) {
        const candidateGenres = new Set(candidate.genres.map(normalized));
        if (candidateGenres.size === 0) return 0;
        return signals.history.reduce((score, item) => {
          const matches = new Set(item.genres.map(normalized));
          const overlap = [...candidateGenres].filter((genre) => matches.has(genre)).length;
          return score + overlap / candidateGenres.size;
        }, 0);
      },
    },
    {
      id: 'cast-affinity',
      weight: 2,
      personalized: true,
      score(candidate, signals) {
        const cast = new Set(candidate.cast.map(normalized));
        if (cast.size === 0) return 0;
        return signals.history.reduce((score, item) => {
          const overlap = item.cast.filter((person) => cast.has(normalized(person))).length;
          return score + Math.min(1, overlap / Math.min(cast.size, 3));
        }, 0);
      },
    },
    {
      id: 'language-affinity',
      weight: 1.5,
      personalized: true,
      score(candidate, signals) {
        const preferred = new Set((signals.preferredLanguages ?? []).map(normalized));
        return preferred.has(normalized(candidate.language)) ? 1 : 0;
      },
    },
    {
      id: 'content-type-affinity',
      weight: 1,
      personalized: true,
      score(candidate, signals) {
        if (signals.preferredTypes?.length) {
          return signals.preferredTypes.includes(candidate.mediaType) ? 1 : 0;
        }
        if (signals.history.length < 2) return 0;
        const sameTypeCount = signals.history.filter((item) => item.mediaType === candidate.mediaType).length;
        return signals.history.length ? sameTypeCount / signals.history.length : 0;
      },
    },
    {
      id: 'metadata-rating',
      weight: 0.25,
      personalized: false,
      score: (candidate) => Math.max(0, Math.min(10, candidate.imdbRating ?? 0)) / 10,
    },
    {
      id: 'trending-signal',
      weight: 0.2,
      personalized: false,
      score: (candidate) => candidate.isTrending ? 1 : 0,
    },
  ];
}

/** Ranks actual catalog entries from local signals. It never invents or fetches candidates. */
export class RecommendationService {
  private strategies: RecommendationStrategy[];
  private limit: number;

  constructor(options: RecommendationServiceOptions = {}) {
    this.strategies = options.strategies ?? createDefaultStrategies();
    this.limit = Math.max(1, Math.min(50, Math.floor(options.limit ?? 15)));
  }

  public recommend(catalog: MediaItem[], signals: RecommendationSignals): MediaItem[] {
    if (catalog.length === 0) return [];
    const excluded = new Set([
      ...signals.history.map((item) => item.id),
      ...(signals.favorites ?? []).map((item) => item.id),
    ]);
    const results: Array<{ item: MediaItem; score: number; personalizedScore: number }> = [];
    const seen = new Set<string>();

    for (const candidate of catalog) {
      if (!candidate.id || excluded.has(candidate.id) || seen.has(candidate.id)) continue;
      seen.add(candidate.id);
      let score = 0;
      let personalizedScore = 0;
      for (const strategy of this.strategies) {
        if (!Number.isFinite(strategy.weight) || strategy.weight <= 0) continue;
        const rawScore = strategy.score(candidate, signals);
        if (!Number.isFinite(rawScore) || rawScore <= 0) continue;
        score += rawScore * strategy.weight;
        if (strategy.personalized) personalizedScore += rawScore * strategy.weight;
      }
      if (personalizedScore > 0) results.push({ item: candidate, score, personalizedScore });
    }

    return results
      .sort((left, right) => right.score - left.score || left.item.title.localeCompare(right.item.title))
      .slice(0, this.limit)
      .map((result) => result.item);
  }
}
