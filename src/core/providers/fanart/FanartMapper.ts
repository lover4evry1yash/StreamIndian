import { ArtworkSet, Image } from '../../models/DomainModels';

export class FanartMapper {
  
  private static mapImage(img: any, type: Image['type']): Image {
    return {
      url: img.url,
      type,
      language: img.lang,
      provider: 'fanart'
    };
  }

  public static mapMovie(data: any): ArtworkSet {
    if (!data) return this.emptyArtworkSet();
    
    const set = this.emptyArtworkSet();
    
    if (data.movieposter) set.posters = data.movieposter.map((i: any) => this.mapImage(i, 'poster'));
    if (data.moviebackground) set.backdrops = data.moviebackground.map((i: any) => this.mapImage(i, 'backdrop'));
    if (data.moviebanner) set.banners = data.moviebanner.map((i: any) => this.mapImage(i, 'banner'));
    if (data.moviethumb) set.landscapes = data.moviethumb.map((i: any) => this.mapImage(i, 'landscape')); // using landscape for moviethumb
    if (data.movielogo) set.logos = data.movielogo.map((i: any) => this.mapImage(i, 'logo'));
    if (data.hdmovielogo) set.clearLogos = data.hdmovielogo.map((i: any) => this.mapImage(i, 'clearlogo'));
    if (data.hdmovieclearart) set.clearArts = data.hdmovieclearart.map((i: any) => this.mapImage(i, 'clearart'));
    if (data.movieclearart) set.clearArts = [...set.clearArts, ...data.movieclearart.map((i: any) => this.mapImage(i, 'clearart'))];
    if (data.moviedisc) set.discArts = data.moviedisc.map((i: any) => this.mapImage(i, 'discart'));

    return set;
  }

  public static mapTv(data: any): ArtworkSet {
    if (!data) return this.emptyArtworkSet();
    
    const set = this.emptyArtworkSet();
    
    if (data.tvposter) set.posters = data.tvposter.map((i: any) => this.mapImage(i, 'poster'));
    if (data.showbackground) set.backdrops = data.showbackground.map((i: any) => this.mapImage(i, 'backdrop'));
    if (data.tvbanner) set.banners = data.tvbanner.map((i: any) => this.mapImage(i, 'banner'));
    if (data.tvthumb) set.landscapes = data.tvthumb.map((i: any) => this.mapImage(i, 'landscape'));
    if (data.clearlogo) set.logos = data.clearlogo.map((i: any) => this.mapImage(i, 'logo'));
    if (data.hdtvlogo) set.clearLogos = data.hdtvlogo.map((i: any) => this.mapImage(i, 'clearlogo'));
    if (data.hdclearart) set.clearArts = data.hdclearart.map((i: any) => this.mapImage(i, 'clearart'));
    if (data.clearart) set.clearArts = [...set.clearArts, ...data.clearart.map((i: any) => this.mapImage(i, 'clearart'))];
    if (data.characterart) set.characterArts = data.characterart.map((i: any) => this.mapImage(i, 'characterart'));

    return set;
  }
  
  private static emptyArtworkSet(): ArtworkSet {
    return {
      posters: [], backdrops: [], banners: [], landscapes: [], thumbs: [],
      logos: [], clearLogos: [], clearArts: [], discArts: [], characterArts: []
    };
  }
}
