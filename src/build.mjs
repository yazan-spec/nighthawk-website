// Nighthawk Construction Group — static site generator.
//
//   node src/build.mjs              production build  → dist/   (root-relative clean URLs)
//   node src/build.mjs --preview    preview build     → dist-preview/ (relative links, single image size)
//
// No framework, no runtime dependencies: pages are plain HTML + one CSS file + one small JS file.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import config from '../site.config.mjs';
import { projects as projectMeta, sectors } from '../content/projects.mjs';
import * as T from './templates.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PREVIEW = process.argv.includes('--preview');
const BASE = (process.env.BASE_PATH || '').replace(/\/$/, ''); // e.g. '/nighthawk-website' for GitHub Pages
const OUT = path.join(ROOT, PREVIEW ? 'dist-preview' : 'dist');
const CDN = 'https://images.squarespace-cdn.com/content/v1/5ed9692b0ecbf80872877fab/';
// Preview builds ship one size per photo (artifact hosting caps file count).
const previewWidths = (v) => [v.widths.filter((w) => w <= 1600).at(-1) ?? v.widths[0]];

// ---------------------------------------------------------------- photos
// content/photo-index.json: every photograph of every project, numbered in the old site's order
//   id → { title, slug, n, w, h, orig }   (id = Squarespace asset id; the file on disk is "<title>-NN.<ext>")
// media/variants.json: generated sizes, keyed "<slug>/<title>-NN.<ext>"
// content/photo-manifest.txt: the EDITED sequence per project (cover first); everything else goes to the complete grid.
const variantsFile = path.join(ROOT, 'media', 'variants.json');
const variants = fs.existsSync(variantsFile) ? JSON.parse(fs.readFileSync(variantsFile, 'utf8')) : {};
const photoIndex = JSON.parse(fs.readFileSync(path.join(ROOT, 'content', 'photo-index.json'), 'utf8'));
const variantByBase = {};
for (const [key, v] of Object.entries(variants)) variantByBase[key.replace(/\.[^.]+$/, '')] = v;

function photo(id) {
  const ix = photoIndex[id];
  if (!ix) throw new Error(`Unknown photograph id ${id}`);
  const name = `${ix.title}-${String(ix.n).padStart(2, '0')}`;
  const v = variantByBase[`${ix.slug}/${name}`];
  return { id, name, n: ix.n, w: v?.w ?? ix.w, h: v?.h ?? ix.h, color: v?.color ?? '#d9d3c8', local: v, cdn: `${id}/${ix.orig}` };
}

function parseManifest() {
  const txt = fs.readFileSync(path.join(ROOT, 'content', 'photo-manifest.txt'), 'utf8');
  const map = new Map();
  for (const line of txt.split('\n')) {
    if (!line.trim() || line.startsWith('#')) continue;
    const [title, legacy, list] = line.split('|');
    const images = list.split(';').map((s) => photo(s.split('@')[0].split('/')[0]));
    map.set(title.trim(), { legacy: legacy.trim(), images });
  }
  return map;
}

// studio photographs (media/originals/_studio/Studio-NN.*): drawings and general imagery used outside the portfolio
function studio(n) {
  const name = `Studio-${String(n).padStart(2, '0')}`;
  const v = variantByBase[`_studio/${name}`];
  if (!v) throw new Error(`Missing studio photograph ${name} (run npm run images)`);
  return { id: `studio-${n}`, name, n, w: v.w, h: v.h, color: v.color, local: v, cdn: null };
}

// photograph number n (as numbered on disk, 1 = first) of a project
function photoN(title, n) {
  const hit = Object.entries(photoIndex).find(([, ix]) => ix.title === title && ix.n === n);
  if (!hit) throw new Error(`No photograph ${n} for ${title}`);
  return photo(hit[0]);
}

// every photograph of a project, in the old site's order
function allPhotos(title) {
  return Object.entries(photoIndex).filter(([, ix]) => ix.title === title).sort((a, b) => a[1].n - b[1].n).map(([id]) => photo(id));
}

export const slugify = (s) =>
  s.toLowerCase().replace(/&/g, '').replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ---------------------------------------------------------------- URLs
// `page` is the output path of the page being rendered, e.g. 'projects/duo-coffee/index.html'.
export function makeUrl(page) {
  const depth = page.split('/').length - 1;
  const up = depth ? '../'.repeat(depth) : './';
  return {
    // route: '' | 'projects/' | 'projects/duo-coffee/'
    to(route) {
      if (PREVIEW) return up + (route === '' ? 'home/' : route) + (route === '' || route.endsWith('/') ? 'index.html' : '');
      return BASE + '/' + route;
    },
    asset(p) {
      return PREVIEW ? up + p : BASE + '/' + p;
    },
    abs(route) {
      return config.url + '/' + route;
    },
  };
}

// Responsive image sources for a photo.
// In the artifact preview every photograph is inlined as a data: URI (the preview host allows at most ~500
// files per version and blocks third-party images); the production build is fully self-hosted and responsive.
const dataUriCache = new Map();
function dataUri(v, max = 1024) {
  const w = v.widths.filter((x) => x <= max).at(-1) ?? v.widths[0];
  const key = `${v.base}-${w}`;
  if (!dataUriCache.has(key)) dataUriCache.set(key, 'data:image/webp;base64,' + fs.readFileSync(path.join(ROOT, 'media', 'variants', `${key}.webp`)).toString('base64'));
  return dataUriCache.get(key);
}
export function imageSources(img, url, { small = false } = {}) {
  if (img.local && PREVIEW) {
    const u = dataUri(img.local, small ? 640 : 1024);
    return { src: u, srcset: '', large: '#', absLarge: `${config.url}/img/${img.local.base}-${img.local.widths.at(-1)}.webp` };
  }
  if (img.local) {
    const widths = PREVIEW ? previewWidths(img.local) : img.local.widths;
    const file = (w) => `img/${img.local.base}-${w}.webp`;
    const srcset = widths.map((w) => `${url.asset(file(w))} ${w}w`).join(', ');
    const mid = widths.find((w) => w >= 1280) ?? widths[widths.length - 1];
    return {
      src: url.asset(file(mid)),
      srcset,
      large: url.asset(file(widths[widths.length - 1])),
      absLarge: `${config.url}/${file(img.local.widths[img.local.widths.length - 1])}`,
    };
  }
  const base = CDN + img.cdn;
  const widths = [500, 750, 1000, 1500, 2500].filter((w, i, a) => w <= img.w || a[i - 1] < img.w);
  return {
    src: `${base}?format=${widths.includes(1500) ? 1500 : widths.at(-1)}w`,
    srcset: widths.map((w) => `${base}?format=${w}w ${Math.min(w, img.w)}w`).join(', '),
    large: `${base}?format=2500w`,
    absLarge: `${base}?format=1500w`,
  };
}

// ---------------------------------------------------------------- assemble data
function buildProjects() {
  const manifest = parseManifest();
  // Portfolio order = the order projects appear on the existing site (first appearance in photo-index.json)
  const siteOrder = [];
  for (const ix of Object.values(photoIndex)) if (!siteOrder.includes(ix.title)) siteOrder.push(ix.title);
  const list = projectMeta.filter((m) => !m.hidden).map((m) => {
    const order = siteOrder.indexOf(m.title);
    const src = manifest.get(m.title);
    if (!src) throw new Error(`No photos in manifest for "${m.title}"`);
    // Photographs run in the existing site's order (cover = its first photograph); exact duplicate files within a project are dropped.
    const seen = new Set();
    const images = allPhotos(m.title).filter((i) => { const k = i.local?.base ?? i.id; if (seen.has(k)) return false; seen.add(k); return true; });
    const extras = [];
    return {
      ...m,
      slug: m.slug ?? slugify(m.title),
      legacy: src.legacy,
      images,
      extras,
      cover: images[0],
      card: images[m.cardCover ?? 0],
      order,
      location: m.location ?? null,
      sequence: [],
    };
  });
  for (const p of list) {
    for (const b of p.sequence) {
      const idx = [b.full, b.inset, b.offset, b.detail, ...(b.pair ?? []), ...(b.trio ?? [])].filter((x) => x !== undefined);
      for (const i of idx) if (!p.images[i]) throw new Error(`${p.title}: sequence points at missing photo ${i}`);
    }
  }
  return list.sort((a, b) => a.order - b.order);
}

const ratio = (im) => im.w / im.h;

// Layout for projects without a hand sequence: reads each photo's proportions and size.
function autoSequence(images, hasText) {
  const rest = images.slice(1).map((im, i) => ({ im, i: i + 1 }));
  const blocks = [];
  const rhythm = ['inset', 'pair', 'offset-right', 'pair', 'full', 'offset-left', 'pair'];
  let k = 0;
  while (rest.length) {
    const cur = rest.shift();
    if (ratio(cur.im) < 0.95) {
      const mates = [];
      for (let j = 0; j < rest.length && mates.length < 2; j++) if (ratio(rest[j].im) < 0.95) mates.push(j);
      if (mates.length) {
        const picked = mates.map((j) => rest[j].i);
        for (const j of mates.reverse()) rest.splice(j, 1);
        blocks.push(picked.length === 2 ? { trio: [cur.i, ...picked] } : { pair: [cur.i, picked[0]] });
      } else blocks.push({ offset: cur.i, side: 'right' });
      continue;
    }
    let kind = rhythm[k++ % rhythm.length];
    if (kind === 'full' && cur.im.w < 2400) kind = 'inset';
    if (kind === 'pair') {
      const j = rest.findIndex((r) => ratio(r.im) >= 0.95);
      if (j === -1) kind = 'inset';
      else {
        blocks.push({ pair: [cur.i, rest[j].i] });
        rest.splice(j, 1);
        continue;
      }
    }
    if (kind === 'full') blocks.push({ full: cur.i });
    else if (kind === 'inset') blocks.push({ inset: cur.i });
    else blocks.push({ offset: cur.i, side: kind.endsWith('left') ? 'left' : 'right' });
  }
  if (hasText) blocks.splice(Math.min(1, blocks.length), 0, { text: true });
  return blocks;
}

// ---------------------------------------------------------------- write helpers
const written = [];
function write(rel, content) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  written.push(rel);
}
function copyDir(from, to) {
  if (!fs.existsSync(from)) return;
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name);
    const b = path.join(to, e.name);
    if (e.isDirectory()) copyDir(a, b);
    else {
      fs.mkdirSync(path.dirname(b), { recursive: true });
      fs.copyFileSync(a, b);
    }
  }
}

// ---------------------------------------------------------------- build
function build() {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  const projects = buildProjects();
  const bySlug = Object.fromEntries(projects.map((p) => [p.slug, p]));
  const featured = projects.filter((p) => p.featured).sort((a, b) => a.featured - b.featured);
  const photo = (ref) => bySlug[ref.project].images[ref.index];

  // static assets (hashed query for cache-busting)
  const css = fs.readFileSync(path.join(ROOT, 'src', 'assets', 'site.css'), 'utf8');
  const js = fs.readFileSync(path.join(ROOT, 'src', 'assets', 'site.js'), 'utf8');
  const hash = crypto.createHash('sha1').update(css + js).digest('hex').slice(0, 8);
  write('assets/site.css', css);
  write('assets/site.js', js);
  copyDir(path.join(ROOT, 'src', 'static'), OUT);

  // images
  if (Object.keys(variants).length && !PREVIEW) {
    const used = new Map();
    for (const p of projects) for (const im of [...p.images, ...p.extras]) if (im.local) used.set(im.local.base, im.local);
    for (const [key, v] of Object.entries(variants)) if (key.startsWith('_studio/')) used.set(v.base, v);
    for (const [base, v] of used) {
      const widths = PREVIEW ? previewWidths(v) : v.widths;
      for (const w of widths) {
        const name = `${base}-${w}.webp`;
        fs.mkdirSync(path.dirname(path.join(OUT, 'img', name)), { recursive: true });
        fs.copyFileSync(path.join(ROOT, 'media', 'variants', name), path.join(OUT, 'img', name));
        written.push('img/' + name);
      }
    }
  }

  const ctx = { config, sectors, projects, bySlug, featured, photo, photoN, studio, hash, preview: PREVIEW, imageSources, makeUrl };

  const pages = [
    [PREVIEW ? 'home/index.html' : 'index.html', T.home],  // preview: the artifact entry page gets a host wrapper, so home lives in a plain file
    ['projects/index.html', T.projectsIndex],
    ['services/index.html', T.services],
    ['contact/index.html', T.contact],
    ['404.html', T.notFound],
  ];
  for (const [file, tpl] of pages) write(file, tpl({ ...ctx, page: file }));
  const sectorPages = Object.keys(sectors).filter((k) => projects.some((p) => p.sectors.includes(k)));
  for (const key of sectorPages) {
    const file = `${key}/index.html`;
    write(file, T.sector({ ...ctx, page: file, key }));
  }
  projects.forEach((p, i) => {
    const file = `projects/${p.slug}/index.html`;
    // next project: next in the same primary sector, wrapping around
    const same = projects.filter((q) => q.sectors[0] === p.sectors[0]);
    const k = same.indexOf(p);
    const next = same[(k + 1) % same.length];
    const prev = same[(k - 1 + same.length) % same.length];
    write(file, T.project({ ...ctx, page: file, p, next, prev }));
  });

  // SEO files
  const routes = ['', 'projects/', ...sectorPages.map((k) => `${k}/`), 'services/', 'contact/',
    ...projects.map((p) => `projects/${p.slug}/`)];
  const today = new Date().toISOString().slice(0, 10);
  write('sitemap.xml',
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    routes.map((r) => `  <url><loc>${config.url}/${r}</loc><lastmod>${today}</lastmod></url>`).join('\n') +
    `\n</urlset>\n`);
  write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${config.url}/sitemap.xml\n`);
  // Old Squarespace URLs → new pages (Netlify / Cloudflare Pages format)
  write('_redirects', [
    '/home / 301', '/portfolio-1 /projects/ 301', '/portfolio /projects/ 301', '/contact-us /contact/ 301',
    '/about /services/ 301', '/process /services/ 301', '/development /services/ 301',
    ...projects.map((p) => `/portfolio-1/${p.legacy} /projects/${p.slug}/ 301`),
  ].join('\n') + '\n');
  write('_headers', `/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n/img/*\n  Cache-Control: public, max-age=31536000, immutable\n`);

  // a machine-readable index for audits
  fs.writeFileSync(path.join(OUT, '..', PREVIEW ? '.preview-files.json' : '.build-files.json'), JSON.stringify(written, null, 1));
  console.log(`${PREVIEW ? 'Preview' : 'Production'} build: ${written.length} files → ${path.relative(ROOT, OUT)}/`);
}

build();
