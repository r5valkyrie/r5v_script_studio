/* eslint-disable */
const path = require('path');
const fs = require('fs');
const { build } = require('esbuild');

function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }

(async () => {
  const projectRoot = path.resolve(__dirname, '..');
  const outDir = path.join(projectRoot, 'electron');
  ensureDir(outDir);

  // Bundle main (ESM)
  await build({
    entryPoints: [path.join(projectRoot, 'js', 'main.js')],
    outfile: path.join(projectRoot, 'electron', 'main.js'),
    bundle: true,
    platform: 'node',
    format: 'esm',
    minify: true,
    sourcemap: false,
    logLevel: 'silent',
    external: [
      'electron', 'fs', 'path', 'node:fs', 'node:path', 'https', 'node:https', 'child_process', 'node:child_process', 'tty', 'node:tty', 'os', 'node:os', 'util', 'node:util', 'stream', 'node:stream', 'crypto', 'node:crypto', 'zlib', 'node:zlib', 'url', 'node:url'
    ],
  });

  // Bundle preload (CJS)
  const preloadSrc = path.join(projectRoot, 'js', 'preload.cjs');
  if (fs.existsSync(preloadSrc)) {
    await build({
      entryPoints: [preloadSrc],
      outfile: path.join(outDir, 'preload.cjs'),
      bundle: true,
      platform: 'node',
      format: 'cjs',
      minify: true,
      sourcemap: false,
      logLevel: 'silent',
      external: ['electron', 'fs', 'path', 'node:fs', 'node:path'],
    });
  }
})();
