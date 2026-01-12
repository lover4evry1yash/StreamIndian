// Example for one catalog
{
  type: 'movie',
  id: 'trending',           // or whatever your catalog IDs are
  name: 'Trending India',
  extra: [
    { name: 'search', isRequired: false }
  ]
},
{
  type: 'series',
  id: 'popular-series',
  name: 'Popular Series',
  extra: [
    { name: 'search', isRequired: false }
  ]
},
// repeat for Bollywood, South Indian, etc.