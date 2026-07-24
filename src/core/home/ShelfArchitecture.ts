import { MediaItem } from '../../types/tizen';
import { Shelf, ShelfContext, ShelfRule } from '../models/Shelf';

export interface ShelfDefinition {
  id: string;
  type: Shelf['type'];
  title: string;
  subtitle?: string;
  rule: ShelfRule;
  dataSource: (catalog: MediaItem[], context: ShelfContext) => MediaItem[];
}

export const HOME_SHELVES: ShelfDefinition[] = [
  {
    id: 'shelf-featured',
    type: 'featured',
    title: 'Featured',
    subtitle: 'Top pick for you',
    rule: {
      isVisible: () => true, // Hidden from UI rows, but used for Hero extraction
      priority: 0
    },
    dataSource: (catalog, context) => {
      // Pick the best item for hero: trending or regional hero
      let featured = catalog.filter(m => m.isRegionalHero || m.isTrending);
      if (featured.length === 0) {
        featured = [catalog[0]]; // Fallback
      }
      return featured.slice(0, 1);
    }
  },
  {
    id: 'shelf-pinned',
    type: 'pinned',
    title: 'Pinned',
    subtitle: 'Your favorite content',
    rule: {
      isVisible: (context) => false, // Architecture ready, waiting for pin service
      priority: 5
    },
    dataSource: (catalog, context) => []
  },
  {
    id: 'shelf-continue-watching',
    type: 'continue_watching',
    title: 'Continue Watching',
    subtitle: 'Pick up where you left off',
    rule: {
      isVisible: (context) => !!context.userHistory && context.userHistory.length > 0,
      priority: 10
    },
    dataSource: (catalog, context) => {
      if (!context.userHistory) return [];
      return catalog.filter(m => context.userHistory!.includes(m.id));
    }
  },
  {
    id: 'shelf-resume-watching',
    type: 'resume_watching',
    title: 'Resume Watching',
    subtitle: 'Quick resume active streams',
    rule: {
      isVisible: (context) => false, // Architecture ready
      priority: 15
    },
    dataSource: (catalog, context) => []
  },
  {
    id: 'shelf-offline-downloads',
    type: 'offline_downloads',
    title: 'Downloads',
    subtitle: 'Ready to watch offline',
    rule: {
      isVisible: (context) => false, // Architecture ready
      priority: 20
    },
    dataSource: (catalog, context) => []
  },
  {
    id: 'shelf-trending',
    type: 'trending',
    title: 'Trending Near You',
    subtitle: 'Popular in your region',
    rule: {
      isVisible: () => true,
      priority: 30
    },
    dataSource: (catalog, context) => {
      return catalog.filter(m => m.isTrending);
    }
  },
  {
    id: 'shelf-movies',
    type: 'movies',
    title: 'Movies',
    subtitle: 'Cinematic experiences',
    rule: {
      isVisible: () => true,
      priority: 40
    },
    dataSource: (catalog, context) => {
      // Return a curated list of movies, filtered by language if present
      let movies = catalog.filter(m => m.mediaType === 'movie' && !m.isTrending);
      if (context.language && context.language !== 'All') {
        movies = movies.filter(m => m.language === context.language);
      }
      return movies;
    }
  },
  {
    id: 'shelf-series',
    type: 'series',
    title: 'Series',
    subtitle: 'Binge-worthy shows',
    rule: {
      isVisible: () => true,
      priority: 50
    },
    dataSource: (catalog, context) => {
      let series = catalog.filter(m => m.mediaType === 'series' && !m.isTrending);
      if (context.language && context.language !== 'All') {
        series = series.filter(m => m.language === context.language);
      }
      return series;
    }
  },
  {
    id: 'shelf-anime',
    type: 'anime',
    title: 'Anime',
    subtitle: 'Japanese animation',
    rule: {
      isVisible: () => true, // Could hide if region strictly prohibits, but generally always visible
      priority: 60
    },
    dataSource: (catalog, context) => {
      return catalog.filter(m => (m.mediaType === 'movie' || m.mediaType === 'series') && 
        (m.genres.includes('Anime') || m.genres.includes('Animation')));
    }
  },
  {
    id: 'shelf-regional',
    type: 'regional',
    title: 'Regional Picks',
    subtitle: 'Stories from close to home',
    rule: {
      isVisible: (context) => !!context.region,
      priority: 70
    },
    dataSource: (catalog, context) => {
      // In a real app, this maps context.region to specific languages or origins
      // For now, if language is set to something specific, show picks for it
      const regionLang = context.language !== 'All' ? context.language : 'Hindi'; // fallback
      return catalog.filter(m => m.language === regionLang && !m.isTrending);
    }
  },
  {
    id: 'shelf-because-you-watched',
    type: 'because_you_watched',
    title: 'Because You Watched...',
    subtitle: 'Personalized recommendations',
    rule: {
      isVisible: (context) => !!context.userHistory && context.userHistory.length > 0,
      priority: 80
    },
    dataSource: (catalog, context) => {
      if (!context.userHistory || context.userHistory.length === 0) return [];
      
      const watchedItems = catalog.filter(m => context.userHistory!.includes(m.id));
      if (watchedItems.length === 0) return [];

      // Extract unique genres from watched history
      const watchedGenres = new Set<string>();
      watchedItems.forEach(item => item.genres.forEach(g => watchedGenres.add(g)));

      // Recommend unwatched items that match at least one watched genre, sorted by matches
      const recommendations = catalog
        .filter(m => !context.userHistory!.includes(m.id)) // Exclude already watched
        .map(item => {
           let matchScore = 0;
           item.genres.forEach(g => {
              if (watchedGenres.has(g)) matchScore++;
           });
           return { item, matchScore };
        })
        .filter(entry => entry.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore)
        .map(entry => entry.item);

      // Return top 15 recommendations
      return recommendations.slice(0, 15);
    }
  },
  {
    id: 'shelf-recently-added',
    type: 'recently_added',
    title: 'Recently Added',
    subtitle: 'Fresh content',
    rule: {
      isVisible: () => true,
      priority: 90
    },
    dataSource: (catalog, context) => {
      return catalog.slice().sort((a,b) => b.year - a.year);
    }
  }
];

export class ShelfEngine {
  public static buildShelves(catalog: MediaItem[], context: ShelfContext): Shelf[] {
    const activeShelves = HOME_SHELVES
      .filter(def => def.rule.isVisible(context))
      .sort((a, b) => a.rule.priority - b.rule.priority)
      .map(def => {
        const items = def.dataSource(catalog, context);
        return {
          id: def.id,
          type: def.type,
          title: def.title,
          subtitle: def.subtitle,
          rule: def.rule,
          items,
          isLoading: false
        } as Shelf;
      });

    // Only return shelves that actually have items (except maybe continue watching if we want to show empty states later)
    return activeShelves.filter(shelf => shelf.items.length > 0 || shelf.type === 'continue_watching');
  }
}

export const RELATED_SHELVES: ShelfDefinition[] = [
  {
    id: 'shelf-more-like-this',
    type: 'because_you_watched',
    title: 'More Like This',
    rule: { isVisible: () => true, priority: 10 },
    dataSource: (catalog, context) => {
      if (!context.targetMedia) return [];
      const m = context.targetMedia;
      return catalog.filter(c => c.id !== m.id && c.genres.some(g => m.genres.includes(g)));
    }
  },
  {
    id: 'shelf-same-collection',
    type: 'because_you_watched',
    title: 'Same Collection',
    rule: { isVisible: (context) => false, priority: 20 },
    dataSource: (catalog, context) => {
      return [];
    }
  },
  {
    id: 'shelf-same-actor',
    type: 'because_you_watched',
    title: 'Same Actor',
    rule: { isVisible: () => true, priority: 30 },
    dataSource: (catalog, context) => {
      // Future ready, placeholder logic
      return [];
    }
  },
  {
    id: 'shelf-related-trending',
    type: 'trending',
    title: 'Trending Now',
    rule: { isVisible: () => true, priority: 40 },
    dataSource: (catalog, context) => {
      return catalog.filter(m => m.isTrending && m.id !== context.targetMedia?.id);
    }
  },
  {
    id: 'shelf-related-regional',
    type: 'regional',
    title: 'Regional Picks',
    rule: { isVisible: () => true, priority: 50 },
    dataSource: (catalog, context) => {
      const regionLang = context.language !== 'All' ? context.language : (context.targetMedia?.language || 'Hindi');
      return catalog.filter(m => m.language === regionLang && m.id !== context.targetMedia?.id);
    }
  }
];

export class RelatedShelfEngine {
  public static buildShelves(catalog: MediaItem[], context: ShelfContext): Shelf[] {
    const activeShelves = RELATED_SHELVES
      .filter(def => def.rule.isVisible(context))
      .sort((a, b) => a.rule.priority - b.rule.priority)
      .map(def => {
        const items = def.dataSource(catalog, context);
        return {
          id: def.id,
          type: def.type,
          title: def.title,
          subtitle: def.subtitle,
          rule: def.rule,
          items,
          isLoading: false
        } as Shelf;
      });
    return activeShelves.filter(shelf => shelf.items.length > 0);
  }
}
