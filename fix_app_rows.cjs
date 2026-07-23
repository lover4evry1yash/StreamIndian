const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

app = app.replace(/const trendingItems = catalog\.filter\(\(m\) => m\.isTrending\);/, 
`const trendingItems = catalog.filter((m) => m.isTrending);
  const trendingMovies = trendingItems.filter(m => m.mediaType === 'movie');
  const trendingSeries = trendingItems.filter(m => m.mediaType === 'series');
  const popularMovies = catalog.filter(m => m.mediaType === 'movie' && m.imdbRating && m.imdbRating > 8);
  const popularSeries = catalog.filter(m => m.mediaType === 'series' && m.imdbRating && m.imdbRating > 8);
  const anime = catalog.filter(m => m.mediaType === 'anime' || m.genres.includes('Animation'));
  const indianMovies = catalog.filter(m => m.mediaType === 'movie' && ['Hindi', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Bengali', 'Marathi', 'Punjabi'].includes(m.language));
  const indianSeries = catalog.filter(m => m.mediaType === 'series' && ['Hindi', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Bengali', 'Marathi', 'Punjabi'].includes(m.language));
  const recentlyAdded = catalog.slice().sort((a,b) => b.year - a.year);
  const recommended = catalog.filter(m => !m.isTrending);
  const topRated = catalog.slice().sort((a,b) => (b.imdbRating || 0) - (a.imdbRating || 0));
  const discover = catalog.slice(0, 10); // Random sample in real app`);

app = app.replace(/\{\/\* Categorized TV Rows \*\/\}.*?<\/main>/s,
`{/* Categorized TV Rows */}
            <div className="space-y-6 pb-20">
              {trendingMovies.length > 0 && <MediaRow rowId="row-trending-movies" title="Trending Movies" subtitle="Current hits" items={trendingMovies} onSelectMedia={setSelectedMedia} />}
              {trendingSeries.length > 0 && <MediaRow rowId="row-trending-series" title="Trending Series" subtitle="Binge-worthy shows" items={trendingSeries} onSelectMedia={setSelectedMedia} />}
              {popularMovies.length > 0 && <MediaRow rowId="row-popular-movies" title="Popular Movies" subtitle="Fan favorites" items={popularMovies} onSelectMedia={setSelectedMedia} />}
              {popularSeries.length > 0 && <MediaRow rowId="row-popular-series" title="Popular Series" subtitle="Highly rated TV" items={popularSeries} onSelectMedia={setSelectedMedia} />}
              {indianMovies.length > 0 && <MediaRow rowId="row-indian-movies" title="Indian Movies" subtitle="Across all languages" items={indianMovies} onSelectMedia={setSelectedMedia} />}
              {indianSeries.length > 0 && <MediaRow rowId="row-indian-series" title="Indian Series" subtitle="Regional and national hits" items={indianSeries} onSelectMedia={setSelectedMedia} />}
              {recentlyAdded.length > 0 && <MediaRow rowId="row-recent" title="Recently Added" subtitle="Fresh content" items={recentlyAdded} onSelectMedia={setSelectedMedia} />}
              {topRated.length > 0 && <MediaRow rowId="row-top-rated" title="Top Rated" subtitle="Critically acclaimed" items={topRated} onSelectMedia={setSelectedMedia} />}
            </div>
          </main>`);

fs.writeFileSync('src/App.tsx', app);
console.log('Fixed App.tsx rows');
