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
import { projects as projectMeta, sectors, ARCHIVE_PHOTO_LIMIT } from '../content/projects.mjs';
import * as T from './templates.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PREVIEW = process.argv.includes('--preview');
const OUT = path.join(ROOT, PREVIEW ? 'dist-preview' : 'dist');
const CDN = 'https://images.squarespace-cdn.com/content/v1/5ed9692b0ecbf80872877fab/';
// Preview builds ship one size per photo (artifact hosting caps file count).
const previewWidths = (v) => [v.widths.filter((w) => w <= 1600).at(-1) ?? v.widths[0]];

// ---------------------------------------------------------------- photos
const variantsFile = path.join(ROOT, 'media', 'variants.json');
const variants = fs.existsSync(variantsFile) ? JSON.parse(fs.readFileSync(variantsFile, 'utf8')) : {};

function parseManifest() {
  const txt = fs.readFileSync(path.join(ROOT, 'content', 'photo-manifest.txt'), 'utf8');
  const map = new Map();
  for (const line of txt.split('\n')) {
    if (!line.trim() || line.startsWith('#')) continue;
    const [title, legacy, list] = line.split('|');
    const images = list.split(';').map((s) => {
      const [p, dim] = s.split('@');
      const [id, file] = p.split('/');
      const [w, h] = dim.split('x').map(Number);
      const v = variants[id];
      return { id, file, w: v?.w ?? w, h: v?.h ?? h, color: v?.color ?? '#d9d3c8', local: v };
    });
    map.set(title.trim(), { legacy: legacy.trim(), images });
  }
  return map;
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
      if (PREVIEW) return up + route + (route === '' || route.endsWith('/') ? 'index.html' : '');
      return '/' + route;
    },
    asset(p) {
      return PREVIEW ? up + p : '/' + p;
    },
    abs(route) {
      return config.url + '/' + route;
    },
  };
}

// Responsive image sources for a photo.
export function imageSources(img, url) {
  if (img.local) {
    const widths = PREVIEW ? previewWidths(img.local) : img.local.widths;
    const srcset = widths.map((w) => `${url.asset(`img/${img.id}-${w}.webp`)} ${w}w`).join(', ');
    const mid = widths.find((w) => w >= 1280) ?? widths[widths.length - 1];
    return {
      src: url.asset(`img/${img.id}-${mid}.webp`),
      srcset,
      large: url.asset(`img/${img.id}-${widths[widths.length - 1]}.webp`),
      absLarge: `${config.url}/img/${img.id}-${img.local.widths[img.local.widths.length - 1]}.webp`,
    };
  }
  const base = CDN + img.id + '/' + img.file;
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
  const list = projectMeta.map((m, order) => {
    const src = manifest.get(m.title);
    if (!src) throw new Error(`No photos in manifest for "${m.title}"`);
    let images = src.images;
    if (!m.sequence && images.length > ARCHIVE_PHOTO_LIMIT) {
      images = [...images.slice(0, ARCHIVE_PHOTO_LIMIT - 1), images.at(-1)];
    }
    return {
      ...m,
      slug: m.slug ?? slugify(m.title),
      legacy: src.legacy,
      images,
      cover: images[0],
      order,
      location: m.location ?? null,
      sequence: m.sequence ?? autoSequence(images, !!m.narrative),
    };
  });
  for (const p of list) {
    for (const b of p.sequence) {
      const idx = [b.full, b.inset, b.offset, b.detail, ...(b.pair ?? []), ...(b.trio ?? [])].filter((x) => x !== undefined);
      for (const i of idx) if (!p.images[i]) throw new Error(`${p.title}: sequence points at missing photo ${i}`);
    }
  }
  return list;
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
  if (Object.keys(variants).length) {
    const used = new Set(projects.flatMap((p) => p.images.map((i) => i.id)));
    for (const id of used) {
      const v = variants[id];
      if (!v) continue;
      const widths = PREVIEW ? previewWidths(v) : v.widths;
      for (const w of widths) {
        const name = `${id}-${w}.webp`;
        fs.mkdirSync(path.join(OUT, 'img'), { recursive: true });
        fs.copyFileSync(path.join(ROOT, 'media', 'variants', name), path.join(OUT, 'img', name));
        written.push('img/' + name);
      }
    }
  }

  const ctx = { config, sectors, projects, bySlug, featured, photo, hash, preview: PREVIEW, imageSources, makeUrl };

  const pages = [
    ['index.html', T.home],
    ['projects/index.html', T.projectsIndex],
    ['about/index.html', T.about],
    ['process/index.html', T.process],
    ['contact/index.html', T.contact],
    ['404.html', T.notFound],
  ];
  for (const [file, tpl] of pages) write(file, tpl({ ...ctx, page: file }));
  for (const key of Object.keys(sectors)) {
    const file = `${key}/index.html`;
    write(file, T.sector({ ...ctx, page: file, key }));
  }
  projects.forEach((p, i) => {
    const file = `projects/${p.slug}/index.html`;
    // next project: next in the same primary sector, wrapping around
    const same = projects.filter((q) => q.sectors[0] === p.sectors[0]);
    const next = same[(same.indexOf(p) + 1) % same.length];
    write(file, T.project({ ...ctx, page: file, p, next }));
  });

  // SEO files
  const routes = ['', 'projects/', ...Object.keys(sectors).map((k) => `${k}/`), 'about/', 'process/', 'contact/',
    ...projects.map((p) => `projects/${p.slug}/`)];
  const today = new Date().toISOString().slice(0, 10);
  write('sitemap.xml',
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    routes.map((r) => `  <url><loc>${config.url}/${r}</loc><lastmod>${today}</lastmod></url>`).join('\n') +
    `\n</urlset>\n`);
  write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${config.url}/sitemap.xml\n`);
  // Old Squarespace URLs → new pages (Netlify / Cloudflare Pages format)
  write('_redirects', [
    '/home / 301', '/portfolio-1 /projects/ 301', '/portfolio /projects/ 301', '/services /process/ 301', '/contact-us /contact/ 301',
    ...projects.map((p) => `/portfolio-1/${p.legacy} /projects/${p.slug}/ 301`),
  ].join('\n') + '\n');
  write('_headers', `/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n/img/*\n  Cache-Control: public, max-age=31536000, immutable\n`);

  // a machine-readable index for audits
  fs.writeFileSync(path.join(OUT, '..', PREVIEW ? '.preview-files.json' : '.build-files.json'), JSON.stringify(written, null, 1));
  console.log(`${PREVIEW ? 'Preview' : 'Production'} build: ${written.length} files → ${path.relative(ROOT, OUT)}/`);
}

build();
