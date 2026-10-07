import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
await mkdir('v3/public/shared', { recursive: true });
await cp('v3/shared/clinical.js', 'v3/public/shared/clinical.js');
const hash = createHash('sha256');
for (const p of [
  'index.html',
  'app.js',
  'cache.js',
  'style.css',
  'logo.png',
  'shared/clinical.js',
  'fonts/thai-400.woff2',
  'fonts/thai-700.woff2',
])
  hash.update(await readFile('v3/public/' + p));
const revision = hash.digest('hex').slice(0, 16);
const sw = await readFile('v3/public/sw.js', 'utf8');
await writeFile(
  'v3/public/sw.js',
  sw.replace(
    /const NAME\s*=\s*'[^']+'/,
    `const NAME='bhh-v3-shell-${revision}'`,
  ),
);
console.log(`V3 static assets built: ${revision}`);
