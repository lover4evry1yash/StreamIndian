// Web Worker for parsing massive M3U files

self.addEventListener('message', (event) => {
  const { m3uContent, playlistId } = event.data;
  
  if (!m3uContent) {
    self.postMessage({ type: 'error', error: 'No content provided' });
    return;
  }

  try {
    const channels = parseM3U(m3uContent, playlistId);
    self.postMessage({ type: 'success', channels });
  } catch (error: any) {
    self.postMessage({ type: 'error', error: error.message });
  }
});

function parseM3U(content: string, playlistId: string): any[] {
  const lines = content.split('\n');
  const channels = [];
  
  let currentChannel: any = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      // Parse EXTINF
      currentChannel = {
        id: crypto.randomUUID(), // Assuming modern browser context inside worker
        playlistId,
        name: '',
        group: 'Uncategorized',
        isFavorite: false,
        isHidden: false,
      };

      // Extract tvg-id
      const tvgIdMatch = line.match(/tvg-id="([^"]+)"/);
      if (tvgIdMatch) currentChannel.tvgId = tvgIdMatch[1];

      // Extract tvg-name
      const tvgNameMatch = line.match(/tvg-name="([^"]+)"/);
      if (tvgNameMatch) currentChannel.tvgName = tvgNameMatch[1];

      // Extract tvg-logo
      const tvgLogoMatch = line.match(/tvg-logo="([^"]+)"/);
      if (tvgLogoMatch) currentChannel.logoUrl = tvgLogoMatch[1];

      // Extract group-title
      const groupTitleMatch = line.match(/group-title="([^"]+)"/);
      if (groupTitleMatch) currentChannel.group = groupTitleMatch[1];

      // Extract Name
      const commaIndex = line.lastIndexOf(',');
      if (commaIndex !== -1) {
        currentChannel.name = line.substring(commaIndex + 1).trim();
      }

    } else if (!line.startsWith('#')) {
      // It's a URL
      if (currentChannel) {
        currentChannel.streamUrl = line;
        channels.push(currentChannel);
        currentChannel = null;
      }
    }
  }

  return channels;
}
