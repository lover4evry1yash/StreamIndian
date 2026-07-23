const fs = require('fs');

let cat = fs.readFileSync('src/providers/indianMediaCatalog.ts', 'utf8');

const idMap = {
  'ind_001': { tmdb: '854188', imdb: 'tt12735488' }, // Kalki 2898 AD
  'ind_002': { tmdb: '1043141', imdb: 'tt15654328' }, // Leo
  'ind_003': { tmdb: '1225377', imdb: 'tt31846574' }, // Aavesham
  'ind_004': { tmdb: '1130053', imdb: 'tt27552943' }, // Stree 2
  'ind_005': { tmdb: '1215162', imdb: 'tt29311090' }, // Kantara
  'ind_006': { tmdb: '394200', imdb: 'tt5613306' }, // Sairat
  'ind_007': { tmdb: '291583', imdb: 'tt4078508' }, // Chotushkone
  'ind_008': { tmdb: '1103006', imdb: 'tt22080776' }, // Carry on Jatta 3
};

Object.keys(idMap).forEach(indId => {
  const ids = idMap[indId];
  cat = cat.replace(`id: '${indId}'`, `id: '${ids.tmdb}',\n    externalIds: { tmdbId: '${ids.tmdb}', imdbId: '${ids.imdb}' }`);
});

// Add some series to the catalog
const seriesToAdd = `  {
    id: '84170',
    externalIds: { tmdbId: '84170', imdbId: 'tt8762206' },
    mediaType: 'series',
    title: 'Mirzapur',
    originalTitle: 'मिर्ज़ापुर',
    language: 'Hindi',
    year: 2018,
    durationMinutes: 50,
    rating: 'A',
    imdbRating: 8.5,
    genres: ['Crime', 'Action'],
    posterUrl: 'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?q=80&w=600&auto=format&fit=crop',
    backdropUrl: 'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?q=80&w=1200&auto=format&fit=crop',
    description: 'A shocking incident at a wedding procession ignites a series of events entangling the lives of two families in the lawless city of Mirzapur.',
    cast: ['Pankaj Tripathi', 'Ali Fazal', 'Divyendu Sharma'],
    director: 'Karan Anshuman',
    provider: 'Amazon Prime',
    isTrending: true,
    streams: []
  },
  {
    id: '92897',
    externalIds: { tmdbId: '92897', imdbId: 'tt10895534' },
    mediaType: 'series',
    title: 'The Family Man',
    language: 'Hindi',
    year: 2019,
    durationMinutes: 45,
    rating: 'U/A 16+',
    imdbRating: 8.7,
    genres: ['Action', 'Comedy', 'Drama'],
    posterUrl: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=600&auto=format&fit=crop',
    backdropUrl: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=1200&auto=format&fit=crop',
    description: 'A working man from the National Investigation Agency tries to protect the nation from terrorism, but he also needs to keep his family safe from his secret job.',
    cast: ['Manoj Bajpayee', 'Priyamani', 'Sharib Hashmi'],
    director: 'Raj & DK',
    provider: 'Amazon Prime',
    isTrending: true,
    streams: []
  },
`;

cat = cat.replace(/export const SAMPLE_INDIAN_MEDIA_CATALOG: MediaItem\[\] = \[/, `export const SAMPLE_INDIAN_MEDIA_CATALOG: MediaItem[] = [\n${seriesToAdd}`);

fs.writeFileSync('src/providers/indianMediaCatalog.ts', cat);
console.log('Fixed indianMediaCatalog');
