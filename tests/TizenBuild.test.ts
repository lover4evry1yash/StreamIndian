import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
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
  assert.match(manifest, /required_version="6\.5"/);
  assert.match(manifest, /metadata key="http:\/\/samsung\.com\/tv\/metadata\/devel\.api\.version" value="6\.5"/);
  assert.match(manifest, /<tizen:content-security-policy>[^<]*script-src 'self'[^<]*connect-src 'self' http: https:/);
  assert.match(readFileSync(resolve(outputDir, '.tproject'), 'utf8'), /tv-samsung-6\.5/);
  const cssFile = readdirSync(resolve(outputDir, 'assets')).find((file) => file.endsWith('.css'));
  assert.ok(cssFile, 'the Tizen application stylesheet must be emitted');
  const css = readFileSync(resolve(outputDir, 'assets', cssFile), 'utf8');
  assert.match(css, /rgb\(/, 'Tizen CSS must include sRGB color fallbacks');
  assert.match(css, /@supports[^{}]*oklab/, 'modern OKLab values must be guarded for older TV engines');
  assert.match(css, /@supports[^{}]*color-mix/, 'modern color mixing must be guarded for older TV engines');
});

test('Tizen entry uses package-relative bundled assets and excludes the Node server', () => {
  const html = readFileSync(resolve(outputDir, 'index.html'), 'utf8');
  const assetRefs = [...html.matchAll(/\b(?:src|href)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((url) => url.startsWith('./assets/'));

  assert.ok(assetRefs.some((url) => url.endsWith('.js')), 'a bundled JavaScript entry must be linked');
  assert.ok(assetRefs.some((url) => url.endsWith('.css')), 'a bundled stylesheet must be linked');
  assert.match(html, /<script type="text\/javascript" src="\$WEBAPIS\/webapis\/webapis\.js"><\/script>/);
  assert.doesNotMatch(html, /(?:src|href)="\/(?:assets|src)\//, 'packaged URLs must not be origin-root-relative');
  for (const ref of assetRefs) {
    assert.ok(existsSync(resolve(outputDir, ref.slice(2))), `asset ${ref} must exist in the package`);
  }
  assert.equal(existsSync(resolve(outputDir, 'server.cjs')), false, 'Tizen package must not contain the Node server');

  const javascript = readdirSync(resolve(outputDir, 'assets'))
    .filter((file) => file.endsWith('.js'))
    .map((file) => readFileSync(resolve(outputDir, 'assets', file), 'utf8'))
    .join('\n');
  assert.doesNotMatch(javascript, /(?:from\s*|require\s*\()\s*['"](?:node:|express(?:\/|['"]))/,
    'the Tizen bundle must not contain Node-only module imports');
  assert.doesNotMatch(javascript, /dist\/server\.cjs|server\.cjs/,
    'the Tizen package must not reference the Node server bundle');
  assert.match(javascript, /application\/avplayer/, 'the TV player chunk must contain the native AVPlay surface');

  const workerBundles = readdirSync(resolve(outputDir, 'assets'))
    .filter((file) => /^(m3u|xmltv)\.worker-.*\.js$/.test(file))
    .map((file) => readFileSync(resolve(outputDir, 'assets', file), 'utf8'))
    .join('\n');
  assert.ok(workerBundles.length > 0, 'IPTV parser workers must be bundled separately');
  assert.doesNotMatch(workerBundles, /crypto\.randomUUID\s*\(/, 'IPTV workers must not require randomUUID');
  assert.match(workerBundles, /getRandomValues/, 'IPTV workers must use the compatible UUID helper');
});
