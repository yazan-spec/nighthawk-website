// Generates responsive WebP variants for every photo in media/originals/ and writes media/variants.json.
//   node scripts/process-images.mjs
// Originals are named <squarespace-asset-id>.<ext> (see content/photo-manifest.txt).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
let sharp;
try { sharp = require('sharp'); } catch { try { sharp = require('/opt/npm-tools/node_modules/sharp'); } catch { console.error('Run `npm install` first (sharp is needed to process images).'); process.exit(1); } }

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'media', 'originals');
const OUT = path.join(ROOT, 'media', 'variants');
const WIDTHS = [640, 1024, 1600, 2200];
fs.mkdirSync(OUT, { recursive: true });

const manifestFile = path.join(ROOT, 'media', 'variants.json');
const manifest = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, 'utf8')) : {};

const files = fs.readdirSync(SRC).filter((f) => /\.(jpe?g|png|webp|avif|tiff?)$/i.test(f));
let done = 0;
const hex = (c) => '#' + [c.r, c.g, c.b].map((v) => v.toString(16).padStart(2, '0')).join('');

async function run(file) {
  const id = file.replace(/\.[^.]+$/, '');
  const input = sharp(path.join(SRC, file)).rotate();
  const meta = await input.metadata();
  const widths = WIDTHS.filter((w) => w < meta.width);
  if (!widths.length || meta.width - widths.at(-1) > 200) widths.push(Math.min(meta.width, 2200));
  for (const w of widths) {
    const out = path.join(OUT, `${id}-${w}.webp`);
    if (!fs.existsSync(out)) await sharp(path.join(SRC, file)).rotate().resize({ width: w }).webp({ quality: 76, effort: 5 }).toFile(out);
  }
  const { dominant } = await sharp(path.join(SRC, file)).resize(32).stats();
  manifest[id] = { w: meta.width, h: meta.height, widths, color: hex(dominant) };
  if (++done % 50 === 0) console.log(`${done}/${files.length}`);
}

const queue = [...files];
await Promise.all(Array.from({ length: 4 }, async () => { while (queue.length) await run(queue.shift()); }));
fs.writeFileSync(manifestFile, JSON.stringify(manifest));
console.log(`Processed ${files.length} photographs → media/variants/`);
