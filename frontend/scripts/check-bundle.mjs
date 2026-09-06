import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const dist = resolve('dist');
const manifest = JSON.parse(readFileSync(resolve(dist, '.vite/manifest.json'), 'utf8'));
const sizes = readdirSync(resolve(dist, 'assets')).filter((file) => file.endsWith('.js'))
  .map((file) => ({ file, size: statSync(resolve(dist, 'assets', file)).size }));
for (const { file, size } of sizes) {
  assert.ok(size <= 500_000, `${file} is ${(size / 1000).toFixed(1)} KB; split it before shipping.`);
}

const visited = new Set();
function checkImports(key, ancestors = new Set()) {
  assert.ok(!ancestors.has(key), `Circular static chunk dependency: ${[...ancestors, key].join(' -> ')}`);
  if (visited.has(key)) return;
  const chunk = manifest[key];
  assert.ok(chunk, `Missing chunk ${key}`);
  for (const dependency of chunk.imports || []) checkImports(dependency, new Set([...ancestors, key]));
  visited.add(key);
}
for (const key of Object.keys(manifest)) checkImports(key);

const initial = new Set();
function collectInitial(key) {
  if (initial.has(key)) return;
  initial.add(key);
  for (const dependency of manifest[key].imports || []) collectInitial(dependency);
}
collectInitial('index.html');
let initialSize = 0;
for (const key of initial) {
  assert.ok(!/maplibre|map-shaders|map-style-spec|leaflet|qr-scanner|barcode-decoder/.test(manifest[key].file), `Heavy feature loaded at startup: ${key}`);
  initialSize += statSync(resolve(dist, manifest[key].file)).size;
}
assert.ok(initialSize <= 350_000, `Initial JavaScript is ${(initialSize / 1000).toFixed(1)} KB; budget is 350 KB.`);
const workers = sizes.filter(({ file }) => file.startsWith('maplibre-gl-worker-'));
assert.equal(workers.length, 1, 'The map worker must be emitted as a versioned asset.');
const largest = sizes.reduce((a, b) => a.size > b.size ? a : b);
console.log(`Bundle checks passed: initial JS ${(initialSize / 1000).toFixed(1)} KB; largest file ${(largest.size / 1000).toFixed(1)} KB; no static chunk cycles.`);
