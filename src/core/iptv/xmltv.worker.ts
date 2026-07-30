// Web Worker for parsing massive XMLTV files
self.addEventListener('message', (event) => {
  const { xmlContent, playlistId } = event.data;
  
  if (!xmlContent) {
    self.postMessage({ type: 'error', error: 'No content provided' });
    return;
  }

  try {
    const programs = parseXmltv(xmlContent, playlistId);
    self.postMessage({ type: 'success', programs });
  } catch (error: any) {
    self.postMessage({ type: 'error', error: error.message });
  }
});

function parseXmltv(content: string, playlistId: string): any[] {
  // We use simple regex matching in worker to avoid creating massive DOM trees with DOMParser
  // This is crucial for Tizen TVs to avoid memory exhaustion
  const programs = [];
  
  const programRegex = /<programme\s+start="([^"]+)"\s+stop="([^"]+)"\s+channel="([^"]+)"[^>]*>([\s\S]*?)<\/programme>/g;
  const titleRegex = /<title[^>]*>([^<]+)<\/title>/;
  const descRegex = /<desc[^>]*>([^<]+)<\/desc>/;

  let match;
  while ((match = programRegex.exec(content)) !== null) {
    const startStr = match[1];
    const stopStr = match[2];
    const channelId = match[3];
    const innerContent = match[4];

    const titleMatch = titleRegex.exec(innerContent);
    const descMatch = descRegex.exec(innerContent);

    const title = titleMatch ? titleMatch[1] : 'Unknown Program';
    const description = descMatch ? descMatch[1] : undefined;

    // Parse XMLTV time format: YYYYMMDDHHmmss [TZ]
    const startTime = parseXmltvTime(startStr);
    const endTime = parseXmltvTime(stopStr);

    if (startTime && endTime) {
      programs.push({
        id: crypto.randomUUID(),
        playlistId,
        tvgId: channelId,
        title,
        description,
        startTime,
        endTime
      });
    }
  }

  return programs;
}

function parseXmltvTime(timeStr: string): number | null {
  // 20231025143000 +0200
  const match = timeStr.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\s*([+-]\d{4})?/);
  if (!match) return null;

  const [_, year, month, day, hour, minute, second, offset] = match;
  
  let dateStr = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  
  if (offset) {
    const sign = offset[0];
    const offHours = offset.substring(1, 3);
    const offMins = offset.substring(3, 5);
    dateStr += `${sign}${offHours}:${offMins}`;
  } else {
    dateStr += 'Z'; // Default to UTC if no offset
  }

  return new Date(dateStr).getTime();
}
