/**
 * StreamIndian - Provider Layer: Indian Cinema & Regional Catalog
 * Encapsulates Indian language discovery, deduplication, ranking, and legal stream resolution.
 */

import { CatalogProvider, MediaItem, StreamSource } from '../types/tizen';

const SAMPLE_INDIAN_MEDIA_CATALOG: MediaItem[] = [
  {
    id: '854188',
    externalIds: { tmdbId: '854188', imdbId: 'tt12735488' },
    mediaType: 'movie',
    title: 'Kalki 2898 AD',
    originalTitle: 'కల్కి 2898 AD',
    language: 'Telugu',
    year: 2024,
    durationMinutes: 181,
    rating: 'U/A 13+',
    imdbRating: 7.8,
    genres: ['Sci-Fi', 'Action', 'Mythology'],
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
    description: 'A modern avatar of Vishnu descends to Earth to protect a unborn child from dystopian dark forces in Kasi.',
    cast: ['Prabhas', 'Amitabh Bachchan', 'Kamal Haasan', 'Deepika Padukone'],
    director: 'Nag Ashwin',
    provider: 'Vyjayanthi Legal Media',
    isTrending: true,
    isRegionalHero: true,
    streams: [
      {
        id: 'st_001_4k',
        quality: '4K HDR',
        format: 'HLS',
        url: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
        bitrate: 15000000,
        audioTrack: 'Telugu (Original 5.1 Dolby Atmos)',
        isLegalPublicStream: true,
        providerName: 'Official Stream CDN'
      },
      {
        id: 'st_001_1080p',
        quality: '1080p FHD',
        format: 'MP4',
        url: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
        bitrate: 6000000,
        audioTrack: 'Hindi Dubbed',
        isLegalPublicStream: true,
        providerName: 'Official Stream CDN'
      }
    ]
  },
  {
    id: '1043141',
    externalIds: { tmdbId: '1043141', imdbId: 'tt15654328' },
    mediaType: 'movie',
    title: 'Maharaja',
    originalTitle: 'மகாராஜா',
    language: 'Tamil',
    year: 2024,
    durationMinutes: 142,
    rating: 'U/A 16+',
    imdbRating: 8.5,
    genres: ['Thriller', 'Action', 'Drama'],
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600&auto=format&fit=crop',
    backdropUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=1200&auto=format&fit=crop',
    description: 'A quiet barber approaches the police station claiming his beloved dustbin named Lakshmi was stolen, setting off a gripping web of vengeance.',
    cast: ['Vijay Sethupathi', 'Anurag Kashyap', 'Mamta Mohandas'],
    director: 'Nithilan Swaminathan',
    provider: 'Passion Studios Legal',
    isTrending: true,
    isRegionalHero: true,
    streams: [
      {
        id: 'st_002_1080p',
        quality: '1080p FHD',
        format: 'MP4',
        url: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
        audioTrack: 'Tamil (Original DTS)',
        isLegalPublicStream: true,
        providerName: 'Regional Content CDN'
      }
    ]
  },
  {
    id: '1225377',
    externalIds: { tmdbId: '1225377', imdbId: 'tt31846574' },
    mediaType: 'movie',
    title: 'Aavesham',
    originalTitle: 'ஆவேஷம் / ஆவேசம்',
    language: 'Malayalam',
    year: 2024,
    durationMinutes: 158,
    rating: 'U/A 13+',
    imdbRating: 7.9,
    genres: ['Action', 'Comedy'],
    posterUrl: 'https://images.unsplash.com/photo-1574267432553-4b4628081c31?q=80&w=600&auto=format&fit=crop',
    backdropUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200&auto=format&fit=crop',
    description: 'Three college students in Bengaluru encounter a eccentric, larger-than-life local gangster named Ranga to handle campus bullies.',
    cast: ['Fahadh Faasil', 'Hipzster', 'Mithun Jai Shankar'],
    director: 'Jithu Madhavan',
    provider: 'Anwar Rasheed Entertainments',
    isTrending: true,
    streams: [
      {
        id: 'st_003_1080p',
        quality: '1080p FHD',
        format: 'MP4',
        url: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
        audioTrack: 'Malayalam (5.1 Surround)',
        isLegalPublicStream: true,
        providerName: 'M-Town Stream Node'
      }
    ]
  },
  {
    id: '1130053',
    externalIds: { tmdbId: '1130053', imdbId: 'tt27552943' },
    mediaType: 'movie',
    title: 'Stree 2: Sarkate Ka Aatank',
    originalTitle: 'स्त्री २',
    language: 'Hindi',
    year: 2024,
    durationMinutes: 147,
    rating: 'U/A 13+',
    imdbRating: 7.6,
    genres: ['Comedy', 'Horror'],
    posterUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=600&auto=format&fit=crop',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
    description: 'The town of Chanderi is haunted by a headless entity known as Sarkata. Vicky and his friends join forces with Stree to save the town.',
    cast: ['Rajkummar Rao', 'Shraddha Kapoor', 'Pankaj Tripathi', 'Aparshakti Khurana'],
    director: 'Amar Kaushik',
    provider: 'Maddock Public Vault',
    isTrending: true,
    streams: [
      {
        id: 'st_004_1080p',
        quality: '1080p FHD',
        format: 'MP4',
        url: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
        audioTrack: 'Hindi (Atmos)',
        isLegalPublicStream: true,
        providerName: 'BollyStream Legal'
      }
    ]
  },
  {
    id: '1215162',
    externalIds: { tmdbId: '1215162', imdbId: 'tt29311090' },
    mediaType: 'movie',
    title: 'Kantara: A Legend Chapter 1',
    originalTitle: 'ಕಾಂತಾರ',
    language: 'Kannada',
    year: 2024,
    durationMinutes: 150,
    rating: 'U/A 16+',
    imdbRating: 8.3,
    genres: ['Action', 'Drama', 'Mythology'],
    posterUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop',
    backdropUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1200&auto=format&fit=crop',
    description: 'Exploring the mythical origins of the Kadamba dynasty and the deep-rooted Daiva culture of coastal Karnataka.',
    cast: ['Rishab Shetty', 'Rukmini Vasanth'],
    director: 'Rishab Shetty',
    provider: 'Hombale Legal Repository',
    isTrending: true,
    streams: [
      {
        id: 'st_005_4k',
        quality: '4K HDR',
        format: 'MP4',
        url: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
        audioTrack: 'Kannada (Original)',
        isLegalPublicStream: true,
        providerName: 'Kannada Digital Cinema'
      }
    ]
  },
  {
    id: '394200',
    externalIds: { tmdbId: '394200', imdbId: 'tt5613306' },
    mediaType: 'movie',
    title: 'Sairat',
    originalTitle: 'सैराट',
    language: 'Marathi',
    year: 2016,
    durationMinutes: 174,
    rating: 'U/A',
    imdbRating: 8.2,
    genres: ['Romance', 'Drama'],
    posterUrl: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=600&auto=format&fit=crop',
    backdropUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=1200&auto=format&fit=crop',
    description: 'Two young lovers from different societal strata battle intense rural prejudices in Maharashtra.',
    cast: ['Rinku Rajguru', 'Akash Thosar'],
    director: 'Nagraj Manjule',
    provider: 'Zee Marathi Classics',
    isTrending: false,
    streams: [
      {
        id: 'st_006_1080p',
        quality: '1080p FHD',
        format: 'MP4',
        url: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
        audioTrack: 'Marathi (Original 5.1)',
        isLegalPublicStream: true,
        providerName: 'Classic Marathi Stream'
      }
    ]
  },
  {
    id: '291583',
    externalIds: { tmdbId: '291583', imdbId: 'tt4078508' },
    mediaType: 'movie',
    title: 'Chotushkone',
    originalTitle: 'চতুষ্কোণ',
    language: 'Bengali',
    year: 2014,
    durationMinutes: 150,
    rating: 'U/A',
    imdbRating: 8.1,
    genres: ['Mystery', 'Thriller', 'Drama'],
    posterUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=600&auto=format&fit=crop',
    backdropUrl: 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?q=80&w=1200&auto=format&fit=crop',
    description: 'Four national award-winning filmmakers meet to craft an anthology movie containing four short stories connected by death.',
    cast: ['Aparna Sen', 'Goutam Ghose', 'Chiranjeet Chakraborty', 'Parambrata Chatterjee'],
    director: 'Srijit Mukherji',
    provider: 'SVF Bengali Legal Library',
    isTrending: false,
    streams: [
      {
        id: 'st_007_720p',
        quality: '720p HD',
        format: 'MP4',
        url: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
        audioTrack: 'Bengali (Original)',
        isLegalPublicStream: true,
        providerName: 'Bengali Cinema Vault'
      }
    ]
  },
  {
    id: '1103006',
    externalIds: { tmdbId: '1103006', imdbId: 'tt22080776' },
    mediaType: 'movie',
    title: 'Carry on Jatta 3',
    originalTitle: 'ਕੈਰੀ ਆਨ ਜੱਟਾ ੩',
    language: 'Punjabi',
    year: 2023,
    durationMinutes: 138,
    rating: 'U',
    imdbRating: 6.8,
    genres: ['Comedy', 'Family'],
    posterUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop',
    backdropUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200&auto=format&fit=crop',
    description: 'A hilarious comedy of errors unfolds when Jass falls in love and creates elaborate lies to convince his conservative father.',
    cast: ['Gippy Grewal', 'Sonam Bajwa', 'Binnu Dhillon', 'Gurpreet Ghuggi'],
    director: 'Smeep Kang',
    provider: 'Humble Motion Pictures',
    isTrending: false,
    streams: [
      {
        id: 'st_008_1080p',
        quality: '1080p FHD',
        format: 'MP4',
        url: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
        audioTrack: 'Punjabi (Stereo)',
        isLegalPublicStream: true,
        providerName: 'Punjabi Movie Hub'
      }
    ]
  }
];

export class IndianMediaProvider implements CatalogProvider {
  id = 'indian_media_core_provider';
  name = 'StreamIndian Core Regional Engine';
  description = 'Discovery index for Hindi, Tamil, Telugu, Malayalam, Kannada, Marathi, Bengali & Punjabi cinema.';
  enabled = true;
  supportedLanguages = ['Hindi', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Bengali', 'Marathi', 'Punjabi', 'Gujarati'];
  isLegalSource = true;

  async fetchCatalog(languageFilter?: string, query?: string): Promise<MediaItem[]> {
    let items = [...SAMPLE_INDIAN_MEDIA_CATALOG];

    if (languageFilter && languageFilter !== 'All') {
      items = items.filter((item) => item.language.toLowerCase() === languageFilter.toLowerCase());
    }

    if (query && query.trim() !== '') {
      const q = query.toLowerCase().trim();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.language.toLowerCase().includes(q) ||
          item.genres.some((g) => g.toLowerCase().includes(q)) ||
          item.cast.some((c) => c.toLowerCase().includes(q)) ||
          item.director.toLowerCase().includes(q)
      );
    }

    return items;
  }

  async resolveStream(mediaId: string): Promise<StreamSource[]> {
    const media = SAMPLE_INDIAN_MEDIA_CATALOG.find((m) => m.id === mediaId);
    return media ? media.streams : [];
  }
}
