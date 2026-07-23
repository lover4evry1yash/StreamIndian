import { CanonicalStreamSource } from '../types';

export class DuplicateFilter {
    public filter(sources: CanonicalStreamSource[]): CanonicalStreamSource[] {
        const seen = new Set<string>();
        return sources.filter(source => {
            let key = source.url || source.infoHash;
            if (!key) {
                key = `${source.title}_${source.quality}_${source.size}_${source.codec}`;
            }
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }
}
