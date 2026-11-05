import { createId } from '../createId';
import type { IptvChannel, IptvProgram } from './models';

const MAX_PLAYLIST_CHARACTERS = 32 * 1024 * 1024;
const MAX_PARSED_RECORDS = 250_000;

export function parseM3uContent(
  content: string,
  playlistId: string,
  makeId: () => string = createId,
): IptvChannel[] {
  assertInputSize(content);
  const channels: IptvChannel[] = [];
  let current: Omit<IptvChannel, 'streamUrl'> | null = null;

  for (let start = 0; start < content.length;) {
    const newline = content.indexOf('\n', start);
    const end = newline < 0 ? content.length : newline;
    const line = content.slice(start, end).trim().replace(/\r$/, '');
    start = newline < 0 ? content.length : newline + 1;

    if (!line) continue;
    if (line.startsWith('#EXTINF:')) {
      const metadata = line.slice(8);
      const separator = findTitleSeparator(metadata);
      const attributes = parseAttributes(separator < 0 ? metadata : metadata.slice(0, separator));
      const name = separator < 0 ? '' : metadata.slice(separator + 1).trim();
      current = {
        id: makeId(),
        playlistId,
        name: name || attributes.get('tvg-name') || 'Unnamed channel',
        group: attributes.get('group-title') || 'Uncategorized',
        tvgId: attributes.get('tvg-id') || undefined,
        tvgName: attributes.get('tvg-name') || undefined,
        logoUrl: attributes.get('tvg-logo') || undefined,
        isFavorite: false,
        isHidden: false,
      };
      continue;
    }

    if (line.startsWith('#') || !current) continue;
    channels.push({ ...current, streamUrl: line });
    current = null;
    assertRecordLimit(channels.length);
  }

  return channels;
}

export function parseXmltvContent(
  content: string,
  playlistId: string,
  makeId: () => string = createId,
): IptvProgram[] {
  assertInputSize(content);
  const programs: IptvProgram[] = [];
  const programPattern = /<programme\b([^>]*)>([\s\S]*?)<\/programme\s*>/gi;

  for (const match of content.matchAll(programPattern)) {
    const attributes = parseAttributes(match[1]);
    const channelId = attributes.get('channel');
    const startTime = parseXmltvTime(attributes.get('start') ?? '');
    const endTime = parseXmltvTime(attributes.get('stop') ?? '');
    const title = extractXmlText(match[2], 'title');
    if (!channelId || startTime === null || endTime === null || endTime <= startTime || !title) continue;

    const description = extractXmlText(match[2], 'desc');
    programs.push({
      id: makeId(),
      playlistId,
      tvgId: channelId,
      title,
      description: description || undefined,
      startTime,
      endTime,
    });
    assertRecordLimit(programs.length);
  }

  return programs;
}

export function parseXmltvTime(value: string): number | null {
  const match = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(?:\s*([+-])(\d{2})(\d{2}))?/.exec(value.trim());
  if (!match) return null;

  const [, yearText, monthText, dayText, hourText, minuteText, secondText, sign, offsetHourText, offsetMinuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59 || second > 59) return null;

  const localUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  const localDate = new Date(localUtc);
  if (localDate.getUTCFullYear() !== year || localDate.getUTCMonth() !== month - 1 || localDate.getUTCDate() !== day) return null;

  const offsetMinutes = offsetHourText
    ? (Number(offsetHourText) * 60 + Number(offsetMinuteText)) * (sign === '+' ? 1 : -1)
    : 0;
  if (Math.abs(offsetMinutes) > 14 * 60) return null;
  return localUtc - offsetMinutes * 60_000;
}

function findTitleSeparator(value: string): number {
  let quote: '"' | "'" | null = null;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (quote) {
      if (character === quote) quote = null;
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === ',') {
      return index;
    }
  }
  return -1;
}

function parseAttributes(value: string): Map<string, string> {
  const attributes = new Map<string, string>();
  const pattern = /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  for (const match of value.matchAll(pattern)) {
    attributes.set(match[1].toLowerCase(), decodeXml(match[2] ?? match[3] ?? ''));
  }
  return attributes;
}

function extractXmlText(value: string, tagName: string): string {
  const pattern = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}\\s*>`, 'i');
  const match = pattern.exec(value);
  if (!match) return '';
  return decodeXml(match[1]
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]*>/g, '')
    .trim());
}

function decodeXml(value: string): string {
  return value.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (entity, name: string) => {
    const key = name.toLowerCase();
    if (key === 'amp') return '&';
    if (key === 'lt') return '<';
    if (key === 'gt') return '>';
    if (key === 'quot') return '"';
    if (key === 'apos') return "'";
    const codePoint = key.startsWith('#x') ? Number.parseInt(key.slice(2), 16) : Number.parseInt(key.slice(1), 10);
    try { return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : entity; }
    catch { return entity; }
  });
}

function assertInputSize(content: string): void {
  if (content.length > MAX_PLAYLIST_CHARACTERS) {
    throw new Error(`Playlist text exceeds the ${MAX_PLAYLIST_CHARACTERS} character parsing limit`);
  }
}

function assertRecordLimit(count: number): void {
  if (count > MAX_PARSED_RECORDS) {
    throw new Error(`Playlist exceeds the ${MAX_PARSED_RECORDS} record parsing limit`);
  }
}
