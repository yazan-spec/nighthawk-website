// Generates responsive WebP variants for every photograph in media/originals/<project>/ and writes media/variants.json.
//   node scripts/process-images.mjs
// Originals are named "<Project title>-NN.<ext>" inside a folder per project slug (see content/photo-index.json).
// Variants are written as media/variants/<slug>/<project-title>-NN-<width>.webp (hyphenated, URL-safe).
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

export const webName = (s) => s.replace(/\.[^.]+$/, '').replace(/['’&]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');

const manifestFile = path.join(ROOT, 'media', 'variants.json');
const manifest = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, 'utf8')) : {};
const hex = (c) => '#' + [c.r, c.g, c.b].map((v) => v.toString(16).padStart(2, '0')).join('');

const jobs = [];
for (const slug of fs.readdirSync(SRC)) {
  const dir = path.join(SRC, slug);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const f of fs.readdirSync(dir)) if (/\.(jpe?g|png|webp|avif|tiff?)$/i.test(f)) jobs.push({ slug, file: f });
}
let done = 0;
async function run({ slug, file }) {
  const key = `${slug}/${file}`;
  const base = `${slug}/${webName(file)}`;
  const input = path.join(SRC, slug, file);
  const meta = await sharp(input).rotate().metadata();
  const widths = WIDTHS.filter((w) => w < meta.width);
  if (!widths.length || meta.width - widths.at(-1) > 200) widths.push(Math.min(meta.width, 2200));
  fs.mkdirSync(path.join(OUT, slug), { recursive: true });
  for (const w of widths) {
    const out = path.join(OUT, `${base}-${w}.webp`);
    if (!fs.existsSync(out)) await sharp(input).rotate().resize({ width: w }).webp({ quality: 76, effort: 5 }).toFile(out);
  }
  if (!manifest[key] || manifest[key].w !== meta.width || manifest[key].h !== meta.height) {
    const { dominant } = await sharp(input).resize(32).stats();
    manifest[key] = { base, w: meta.width, h: meta.height, widths, color: hex(dominant) };
  }
  if (++done % 100 === 0) console.log(`${done}/${jobs.length}`);
}
const queue = [...jobs];
const failed = [];
await Promise.all(Array.from({ length: 4 }, async () => {
  while (queue.length) {
    const job = queue.shift();
    try { await run(job); } catch (e) { failed.push(job); console.error(`✗ ${job.slug}/${job.file}: ${e.message}`); }
  }
}));
if (failed.length) console.error(`${failed.length} photograph(s) could not be processed`);
// drop manifest entries whose originals are gone
for (const k of Object.keys(manifest)) if (!jobs.some((j) => `${j.slug}/${j.file}` === k)) delete manifest[k];
fs.writeFileSync(manifestFile, JSON.stringify(manifest));
console.log(`Processed ${jobs.length - failed.length} photographs → media/variants/ (sharp ${sharp.versions?.sharp ?? '?'})`);
if (failed.length === jobs.length) process.exit(1);
