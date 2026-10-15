# Nighthawk Construction Group website

Static site generator; no framework. Read README.md first.

- Build: `npm run build` → dist/. Preview locally: `npm run serve` (or any static server on dist/).
- Images: `npm run images` regenerates media/variants/ from media/originals/ (needs `sharp`; run once after cloning).
- Content lives in content/projects.mjs and content/photo-manifest.txt; company details, homepage hero and featured projects in site.config.mjs. Services wording is in src/templates.mjs (SERVICES). Studio imagery: media/originals/_studio/.
- Pages: Home, Portfolio (/projects/ + sector filters), Services, Contact. Design system: src/assets/site.css (tokens at the top). Templates: src/templates.mjs. Enhancement: src/assets/site.js.
- Accuracy rule: never invent project facts (locations, years, architects, clients, stats). Leave unknowns null.
- Never deploy to nighthawkcg.com or touch the Squarespace site without the owner's explicit approval.
