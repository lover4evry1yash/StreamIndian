import test from "node:test";
import { extractMediaInfo } from '../src/utils/mediaId';

test('Prefetch Media ID Parsing', async (t) => {
  await t.test('parses simple ID with hyphens', () => {
    const res = extractMediaInfo('search__media__movie__1234-56');
    if (!res || res.type !== 'movie' || res.id !== '1234-56') throw new Error('Failed');
  });

  await t.test('parses row ID with index', () => {
    const res = extractMediaInfo('rowId__media__series__tt1234567__0');
    if (!res || res.type !== 'series' || res.id !== 'tt1234567') throw new Error('Failed');
  });

  await t.test('ignores invalid structures', () => {
    const res = extractMediaInfo('search-media-movie-1234');
    if (res) throw new Error('Should have failed');
  });
});
