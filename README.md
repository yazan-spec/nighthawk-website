# Nighthawk Construction Group — website

A static, dependency-free site: plain HTML + one CSS file + one JS file, generated from a small set of content files.
No framework, no backend. Hosts anywhere that serves static files (Netlify, Cloudflare Pages, Vercel, S3).

## Layout

```
site.config.mjs            company details, navigation, homepage hero (stills now, film later), contact form target
content/projects.mjs       one entry per project: title, sector(s), featured order, narrative, hand-sequenced layout
content/photo-manifest.txt one line per project: the curated photographs, cover first (Squarespace asset ids)
media/originals/           the 518 curated photographs (web masters, ~2200 px)
media/variants/            generated responsive WebP sizes + media/variants.json (sizes, dominant colour)
src/build.mjs              the generator
src/templates.mjs          page templates (home, projects, sector, project, about, process, contact, 404)
src/assets/site.css|js     the design system and the progressive enhancement
src/static/                fonts (self-hosted, OFL-licensed), favicon
scripts/process-images.mjs builds media/variants from media/originals
scripts/shoot.mjs          visual QA screenshots (desktop / tablet / phone)
dist/                      the production site (output; deploy this folder)
```

## Build

```
node scripts/process-images.mjs   # only when photographs change
node src/build.mjs                # → dist/
node src/build.mjs --preview      # → dist-preview/ (relative links, one image size; for review only)
```

## Adding a project

1. Put the photographs in `media/originals/` named `<id>.jpg` (any unique id) and run `node scripts/process-images.mjs`,
   or add a line to `content/photo-manifest.txt` using the Squarespace ids while the old site is still up.
2. Add an entry to `content/projects.mjs`: `{ title: '123 Street', sectors: ['residential'] }` is enough.
   Add `narrative` for a short paragraph, `featured: n` to place it on the homepage, and `sequence` to hand-lay the page.
3. `node src/build.mjs`.

## Homepage film

When the construction-sequence film exists, drop the encodes in `dist/media/hero/` (or `src/static/media/hero/`)
and fill `hero.video` in `site.config.mjs`. The hero, chapter index and pause control are already built for it;
the stills sequence is the fallback for reduced-motion and data-saver visitors.

## Contact form

Set `form.provider` in `site.config.mjs`: `netlify` (zero config on Netlify) or `endpoint` with a Formspree/Basin URL.

## Deploying

Deploy `dist/`. `_redirects` maps every old Squarespace URL (`/portfolio-1/...`) to the new project pages, and
`_headers` sets long cache lifetimes for images and assets. `sitemap.xml` and `robots.txt` are generated.
Do not point the nighthawkcg.com domain at this build until it has been approved.
