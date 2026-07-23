import { ArtworkSet, Image } from '../models/DomainModels';

export class ArtworkSelector {
  public selectBestPoster(artwork: ArtworkSet): Image | null {
    if (artwork.posters && artwork.posters.length > 0) {
      // Prioritize textless or high-res
      return artwork.posters[0];
    }
    return null;
  }

  public selectBestBackdrop(artwork: ArtworkSet): Image | null {
    if (artwork.backdrops && artwork.backdrops.length > 0) {
      return artwork.backdrops[0];
    }
    return null;
  }
  
  public selectBestLogo(artwork: ArtworkSet): Image | null {
    if (artwork.logos && artwork.logos.length > 0) {
      // Priority clearLogo, then logo
      return artwork.logos[0];
    }
    return null;
  }
}
