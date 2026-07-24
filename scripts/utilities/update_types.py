content = open('src/core/providers/types.ts').read()
old = """export interface IMetadataProvider extends IProvider {
  getMovie(id: string): Promise<Movie | null>;
  getSeries(id: string): Promise<Series | null>;
  getEpisodes(seriesId: string, season: number): Promise<Episode[] | null>;
}"""
new = """export interface IMetadataProvider extends IProvider {
  getMovie(id: string): Promise<Movie | null>;
  getSeries(id: string): Promise<Series | null>;
  getEpisodes(seriesId: string, season: number): Promise<Episode[] | null>;
  getAnime?(id: string): Promise<Anime | null>;
}"""
content = content.replace(old, new)
open('src/core/providers/types.ts', 'w').write(content)
