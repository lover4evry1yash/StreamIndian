import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const outputDir = resolve(process.cwd(), 'dist', 'tizen');

test('Tizen build emits the manifest, Tizen Studio project, icon, and web entry', () => {
  for (const file of ['index.html', 'config.xml', '.tproject', 'icon.png']) {
    assert.ok(existsSync(resolve(outputDir, file)), `dist/tizen/${file} must exist`);
  }

  const manifest = readFileSync(resolve(outputDir, 'config.xml'), 'utf8');
  assert.match(manifest, /<content\s+src="index\.html"\s*\/>/);
  assert.match(manifest, /<icon\s+src="icon\.png"\s*\/>/);
  assert.match(manifest, /version="1\.0\.0"/);
});

test('Tizen entry uses package-relative bundled assets and excludes the Node server', () => {
  const html = readFileSync(resolve(outputDir, 'index.html'), 'utf8');
  const assetRefs = [...html.matchAll(/\b(?:src|href)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((url) => url.startsWith('./assets/'));

  assert.ok(assetRefs.some((url) => url.endsWith('.js')), 'a bundled JavaScript entry must be linked');
  assert.ok(assetRefs.some((url) => url.endsWith('.css')), 'a bundled stylesheet must be linked');
  assert.doesNotMatch(html, /(?:src|href)="\/(?:assets|src)\//, 'packaged URLs must not be origin-root-relative');
  for (const ref of assetRefs) {
    assert.ok(existsSync(resolve(outputDir, ref.slice(2))), `asset ${ref} must exist in the package`);
  }
  assert.equal(existsSync(resolve(outputDir, 'server.cjs')), false, 'Tizen package must not contain the Node server');
});
