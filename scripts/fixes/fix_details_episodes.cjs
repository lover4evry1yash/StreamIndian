const fs = require('fs');

let file = fs.readFileSync('src/core/details/MediaDetailsManager.ts', 'utf8');

file = file.replace(/if \(episodes\) \{/,
`if (episodes && episodes.length > 0) {
        } else {
          // Placeholder
          details.activeSeason = { id: \`\$\{id}_s\$\{seasonNumber}\`, seriesId: id, seasonNumber, title: \`Season \$\{seasonNumber}\`, episodesCount: 1, overview: '', images: [], artwork: { posters: [], backdrops: [], banners: [], landscapes: [], thumbs: [], logos: [], clearLogos: [], clearArts: [], discArts: [], characterArts: [] } };
          details.activeEpisodes = [{ id: \`\$\{id}_s\$\{seasonNumber}_e1\`, seriesId: id, seasonNumber, episodeNumber: 1, title: 'Episode 1 (Placeholder)', overview: 'Episode data unavailable.', durationMinutes: 45, images: [], artwork: {} }];
        }
        if (episodes && episodes.length > 0) { // keep existing block structure if it works`);

file = file.replace(/if \(episodes && episodes\.length > 0\) \{\n        \} else \{/, `if (episodes && episodes.length > 0) {`); // Fix my hack above if I messed up regex.

// Let's do it cleanly:
file = fs.readFileSync('src/core/details/MediaDetailsManager.ts', 'utf8');
file = file.replace(/const episodes = await this\.metadataManager\.getEpisodes\(id, seasonNumber\);\n\s*if \(episodes\) \{/, 
`const episodes = await this.metadataManager.getEpisodes(id, seasonNumber);
        if (episodes && episodes.length > 0) {`);
file = file.replace(/details\.activeEpisodes = episodes;\n\s*\}/, 
`details.activeEpisodes = episodes;
        } else {
          details.activeSeason = { id: \`\$\{id}_s\$\{seasonNumber}\`, seriesId: id, seasonNumber, title: \`Season \$\{seasonNumber}\`, episodesCount: 1, overview: '', images: [], artwork: { posters: [], backdrops: [], banners: [], landscapes: [], thumbs: [], logos: [], clearLogos: [], clearArts: [], discArts: [], characterArts: [] } };
          details.activeEpisodes = [{ id: \`\$\{id}_s\$\{seasonNumber}_e1\`, seriesId: id, seasonNumber, episodeNumber: 1, title: 'Episode 1 (Placeholder)', overview: 'Episode data unavailable.', durationMinutes: 45, images: [], artwork: {} }];
        }`);

file = file.replace(/const episodes = await this\.metadataManager\.getEpisodes\(seriesId, seasonNumber\);\n\s*if \(episodes\) \{/, 
`const episodes = await this.metadataManager.getEpisodes(seriesId, seasonNumber);
      if (episodes && episodes.length > 0) {`);

file = file.replace(/this\.repository\.setActiveDetails\(seriesId, details\);\n\s*this\.eventBus\.emit\(MediaDetailsEventType\.DETAILS_UPDATED, \{ mediaId: seriesId, mediaType: details\.type, data: details \}\);\n\s*\}/, 
`this.repository.setActiveDetails(seriesId, details);
        this.eventBus.emit(MediaDetailsEventType.DETAILS_UPDATED, { mediaId: seriesId, mediaType: details.type, data: details });
      } else {
        details.activeSeason = { id: \`\$\{seriesId}_s\$\{seasonNumber}\`, seriesId, seasonNumber, title: \`Season \$\{seasonNumber}\`, episodesCount: 1, overview: '', images: [], artwork: { posters: [], backdrops: [], banners: [], landscapes: [], thumbs: [], logos: [], clearLogos: [], clearArts: [], discArts: [], characterArts: [] } };
        details.activeEpisodes = [{ id: \`\$\{seriesId}_s\$\{seasonNumber}_e1\`, seriesId, seasonNumber, episodeNumber: 1, title: 'Episode 1 (Placeholder)', overview: 'Episode data unavailable.', durationMinutes: 45, images: [], artwork: {} }];
        this.repository.setActiveDetails(seriesId, details);
        this.eventBus.emit(MediaDetailsEventType.DETAILS_UPDATED, { mediaId: seriesId, mediaType: details.type, data: details });
      }`);

fs.writeFileSync('src/core/details/MediaDetailsManager.ts', file);
console.log('Fixed MediaDetailsManager');
