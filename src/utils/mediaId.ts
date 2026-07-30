export const extractMediaInfo = (nodeId: string): { type: 'movie'|'series'|'anime', id: string } | null => {
    const parts = nodeId.split('__');
    const mediaIndex = parts.indexOf('media');
    if (mediaIndex !== -1 && mediaIndex + 2 < parts.length) {
        const type = parts[mediaIndex + 1];
        if (type === 'movie' || type === 'series' || type === 'anime') {
            return { type, id: parts[mediaIndex + 2] };
        }
    }
    return null;
};
