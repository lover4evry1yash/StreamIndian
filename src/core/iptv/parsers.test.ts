import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { parseM3uContent, parseXmltvContent, parseXmltvTime } from './parsers';

const fixture = (name: string) => readFileSync(resolve(process.cwd(), 'tests', 'fixtures', name), 'utf8');

test('M3U parser handles attribute order, quoted commas, optional metadata and ignored directives', () => {
  let id = 0;
  const channels = parseM3uContent(fixture('iptv-synthetic.m3u'), 'fixture-playlist', () => `channel-${++id}`);

  assert.equal(channels.length, 2);
  assert.equal(channels[0].name, 'Synthetic News, West');
  assert.equal(channels[0].group, 'News, World');
  assert.equal(channels[0].logoUrl, 'https://images.example.test/news.png');
  assert.equal(channels[0].tvgId, 'synthetic.news');
  assert.equal(channels[0].streamUrl, 'https://media.example.test/live/news.m3u8');
  assert.equal(channels[1].name, 'Synthetic Sports');
  assert.equal(channels[1].group, 'Sports');
  assert.equal(channels.every((channel) => channel.playlistId === 'fixture-playlist'), true);
});

test('XMLTV parser matches attributes independent of order and decodes text safely', () => {
  let id = 0;
  const programs = parseXmltvContent(fixture('iptv-synthetic.xml'), 'fixture-playlist', () => `program-${++id}`);

  assert.equal(programs.length, 2);
  assert.equal(programs[0].title, 'Synthetic & Local News');
  assert.equal(programs[0].description, 'An example programme < description.');
  assert.equal(programs[0].tvgId, 'synthetic.news');
  assert.equal(programs[1].title, 'Afternoon "Update"');
  assert.equal(programs[0].startTime, Date.UTC(2026, 10, 6, 5, 30));
  assert.equal(programs[0].endTime, Date.UTC(2026, 10, 6, 6, 30));
});

test('XMLTV time parser rejects invalid dates and accounts for offsets', () => {
  assert.equal(parseXmltvTime('20260230010000 +0000'), null);
  assert.equal(parseXmltvTime('20261106110000 +0530'), Date.UTC(2026, 10, 6, 5, 30));
  assert.equal(parseXmltvTime('20261106110000 -0500'), Date.UTC(2026, 10, 6, 16, 0));
});

test('IPTV parsers reject oversized text before allocating parsed records', () => {
  assert.throws(() => parseM3uContent('x'.repeat(32 * 1024 * 1024 + 1), 'large'), /character parsing limit/);
});
