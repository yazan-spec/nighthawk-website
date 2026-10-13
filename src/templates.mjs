// Page templates. Plain template literals; every page is rendered to static HTML at build time.

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const pad = (n) => String(n).padStart(2, '0');

// ---------------------------------------------------------------- image
function img(ctx, url, im, { sizes = '100vw', alt = '', eager = false, cls = '', fit = '' } = {}) {
  const s = ctx.imageSources(im, url);
  return `<img class="${cls}" src="${s.src}" srcset="${s.srcset}" sizes="${sizes}" width="${im.w}" height="${im.h}"` +
    ` alt="${esc(alt)}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async"` +
    ` style="--tone:${im.color}${fit ? `;object-position:${fit}` : ''}">`;
}

const altFor = (p, i) => (p.alts && p.alts[i]) || `${p.title}, photograph ${i + 1} of ${p.images.length}`;

// ---------------------------------------------------------------- shell
function head(ctx, url, { title, description, ogImage, route, jsonld = [] }) {
  const { config } = ctx;
  const full = title ? `${title} — ${config.name}` : `${config.name} — Houston general contractor & design–build`;
  const canonical = url.abs(route);
  const org = {
    '@context': 'https://schema.org',
    '@type': 'GeneralContractor',
    name: config.name,
    url: config.url + '/',
    email: config.contact.email,
    telephone: config.contact.phoneE164,
    address: {
      '@type': 'PostalAddress',
      streetAddress: config.contact.street,
      addressLocality: config.contact.city,
      addressRegion: config.contact.region,
      postalCode: config.contact.postalCode,
      addressCountry: config.contact.country,
    },
    areaServed: { '@type': 'City', name: 'Houston' },
    sameAs: Object.values(config.social),
  };
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(full)}</title>
<meta name="description" content="${esc(description || config.description)}">
${ctx.preview ? '<meta name="robots" content="noindex, nofollow">' : `<link rel="canonical" href="${canonical}">`}
<meta property="og:site_name" content="${esc(config.name)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title || config.name)}">
<meta property="og:description" content="${esc(description || config.description)}">
<meta property="og:url" content="${canonical}">
${ogImage ? `<meta property="og:image" content="${ogImage}">\n<meta name="twitter:card" content="summary_large_image">` : ''}
<meta name="theme-color" content="#f7f5f1">
<link rel="icon" href="${url.asset('favicon.svg')}" type="image/svg+xml">
<link rel="preload" href="${url.asset('fonts/cormorant-garamond.woff')}" as="font" type="font/woff" crossorigin>
<link rel="preload" href="${url.asset('fonts/hanken-grotesk.woff')}" as="font" type="font/woff" crossorigin>
<link rel="stylesheet" href="${url.asset('assets/site.css')}?v=${ctx.hash}">
<script type="application/ld+json">${JSON.stringify([org, ...jsonld])}</script>
<script>document.documentElement.classList.add('js');try{if(sessionStorage.getItem('nh-seen'))document.documentElement.classList.add('no-veil')}catch(e){}</script>
</head>`;
}

const NAV = [
  ['projects/', 'Projects'],
  ['about/', 'About'],
  ['process/', 'Process'],
];

function header(ctx, url, { route, overlay }) {
  const { config, sectors } = ctx;
  const current = (r) => (route === r || (r === 'projects/' && (route.startsWith('projects') || sectors[route.replace('/', '')])) ? ' aria-current="page"' : '');
  return `<a class="skip" href="#main">Skip to content</a>
<header class="site-header${overlay ? ' over-dark' : ''}" data-header${overlay ? ' data-overlay' : ''}>
  <a class="wordmark" href="${url.to('')}" aria-label="${esc(config.name)}, home">
    <img class="wm-light" src="${url.asset('brand/emblem-light.png')}" width="1359" height="253" alt="">
    <img class="wm-dark" src="${url.asset('brand/emblem-dark.png')}" width="1359" height="253" alt="">
    <span class="wm-text">Nighthawk<small>Construction Group</small></span>
  </a>
  <nav class="nav" aria-label="Primary">
    <ul>${NAV.map(([r, l]) => `<li><a href="${url.to(r)}"${current(r)}>${l}</a></li>`).join('')}</ul>
  </nav>
  <div class="header-right">
    <a class="header-cta" href="${url.to('contact/')}"${current('contact/')}>Start a project</a>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="menu" data-menu-btn>
      <span class="menu-btn-label">Menu</span>
    </button>
  </div>
</header>
<div class="menu" id="menu" data-menu hidden>
  <nav class="menu-inner" aria-label="Menu">
    <ul class="menu-main">
      <li><a href="${url.to('')}">Home</a></li>
      ${NAV.map(([r, l]) => `<li><a href="${url.to(r)}">${l}</a></li>`).join('')}
      <li><a href="${url.to('contact/')}">Contact</a></li>
    </ul>
    <ul class="menu-sectors">
      ${Object.entries(sectors).map(([k, s]) => `<li><a href="${url.to(k + '/')}">${s.name}</a></li>`).join('')}
    </ul>
    <p class="menu-contact">
      <span class="selectable">${config.contact.email}</span><br>
      <span class="selectable">${config.contact.phone}</span><br>
      ${config.contact.street}, ${config.contact.city}
    </p>
  </nav>
</div>`;
}

function footer(ctx, url) {
  const { config, sectors } = ctx;
  const c = config.contact;
  return `<footer class="site-footer">
  <div class="wrap footer-grid">
    <div class="footer-col fc-1">
      <p class="label">Studio</p>
      <address>${c.street}<br>${c.city}, ${c.region} ${c.postalCode}</address>
      <p><a href="mailto:${c.email}">${c.email}</a><br><a href="tel:${c.phoneE164}">${c.phone}</a></p>
    </div>
    <nav class="footer-col fc-2" aria-label="Sectors">
      <p class="label">Work</p>
      <ul>${Object.entries(sectors).map(([k, s]) => `<li><a href="${url.to(k + '/')}">${s.name}</a></li>`).join('')}
      <li><a href="${url.to('projects/')}">All projects</a></li></ul>
    </nav>
    <nav class="footer-col fc-3" aria-label="Company">
      <p class="label">Company</p>
      <ul><li><a href="${url.to('about/')}">About</a></li><li><a href="${url.to('process/')}">Process</a></li><li><a href="${url.to('contact/')}">Contact</a></li>
      <li><a href="${config.social.instagram}" rel="noopener">Instagram</a></li><li><a href="${config.social.facebook}" rel="noopener">Facebook</a></li></ul>
    </nav>
  </div>
  <p class="wrap footer-big"><img src="${url.asset('brand/logo-light.png')}" width="1359" height="549" alt="${esc(config.name)}" loading="lazy"></p>
  <p class="wrap footer-legal"><span>© ${new Date().getFullYear()} ${config.name}</span><span>Houston, Texas</span></p>
</footer>`;
}

function page(ctx, { title, description, ogImage, body, jsonld, bodyClass = '', veil = false, overlay = false }) {
  const url = ctx.makeUrl(ctx.page);
  const route = ctx.page.replace(/index\.html$/, '').replace(/^404\.html$/, '404');
  return `${head(ctx, url, { title, description, ogImage, route, jsonld })}
<body class="${bodyClass}">
${veil ? `<div class="veil" data-veil aria-hidden="true"><img class="veil-mark" src="${url.asset('brand/logo-light.png')}" width="1359" height="549" alt=""><span class="veil-rule"></span></div>` : ''}
<div class="cursor" data-cursor aria-hidden="true"><span>View</span></div>
${header(ctx, url, { route, overlay })}
<main id="main">
${body(url)}
</main>
${footer(ctx, url)}
<dialog class="lightbox" data-lightbox aria-label="Photograph viewer">
  <img alt="" data-lightbox-img>
  <p class="lb-count" data-lightbox-count></p>
  <button class="lb-close" type="button" data-lightbox-close>Close</button>
  <button class="lb-prev" type="button" data-lightbox-prev aria-label="Previous photograph"></button>
  <button class="lb-next" type="button" data-lightbox-next aria-label="Next photograph"></button>
</dialog>
<script src="${url.asset('assets/site.js')}?v=${ctx.hash}" defer></script>
</body>
</html>
`;
}

// ---------------------------------------------------------------- shared pieces
function sectorNames(ctx, p) {
  return p.sectors.map((s) => ctx.sectors[s].name).join(', ');
}

function card(ctx, url, p, span, n) {
  const sizes = span >= 7 ? '(min-width: 1024px) 56vw, 100vw' : span >= 5 ? '(min-width: 1024px) 42vw, 100vw' : '(min-width: 1024px) 31vw, (min-width: 600px) 50vw, 100vw';
  return `<li class="card card--${span}" data-reveal>
  <a href="${url.to(`projects/${p.slug}/`)}" data-view>
    <figure class="card-fig">${img(ctx, url, p.cover, { sizes, alt: '' })}</figure>
    <div class="card-cap"><span class="card-n">${pad(n)}</span><h3 class="card-title">${esc(p.title)}</h3><p class="card-meta">${sectorNames(ctx, p)}</p></div>
  </a>
</li>`;
}

// Column spans for project grids (12-column): large/small pairs, an even pair, then a band of three.
const RHYTHM = [7, 5, 5, 7, 6, 6, 4, 4, 4];
function cardGrid(ctx, url, list) {
  return `<ul class="cards">${list.map((p, i) => card(ctx, url, p, RHYTHM[i % RHYTHM.length], i + 1)).join('\n')}</ul>`;
}

function contactBand(ctx, url) {
  const c = ctx.config.contact;
  return `<section class="cta on-bone" aria-labelledby="cta-h">
  <div class="wrap cta-grid">
    <h2 id="cta-h" class="cta-title" data-reveal>Planning a house, a restaurant <em>or a build-out?</em></h2>
    <div class="cta-side" data-reveal>
      <p class="label">Start a conversation</p>
      <p class="cta-lines"><a href="mailto:${c.email}">${c.email}</a><br><a href="tel:${c.phoneE164}">${c.phone}</a></p>
      <a class="btn" href="${url.to('contact/')}">Start a project</a>
    </div>
  </div>
</section>`;
}

const STEPS = [
  { short: 'Brief', title: 'Brief and site', teaser: 'The site, the program, the budget and the timeline.',
    body: 'Every project starts with the site and what you want to build on it: the program, the budget you are working to and the date you need to open or move in.',
    img: { project: '10135-kerrwood', index: 2 } },
  { short: 'Pre-construction', title: 'Pre-construction', teaser: 'Scope, cost and schedule settled before work begins.',
    body: 'Scope, cost and sequence are worked through before anything is built, so decisions are made on paper rather than on site.',
    img: { project: 'duo-coffee', index: 4 } },
  { short: 'Design and drawings', title: 'Design and drawings', teaser: 'Design, architectural drawings and MEP engineering in-house.',
    body: 'Interior and exterior design and architectural drawings, with mechanical, electrical and plumbing engineering drawings produced alongside them.',
    img: { project: '12459-mooremeadow', index: 4 } },
  { short: 'Permits', title: 'Permits', teaser: 'Applications and expediting so construction can start sooner.',
    body: 'Permit acquisition and expediting are handled for you, to shorten the time between approved drawings and the first day on site.',
    img: { project: '7210-dearborn', index: 3 } },
  { short: 'Construction', title: 'Construction', teaser: 'One team managing trades, quality and schedule.',
    body: 'One team manages the trades, the schedule and the quality of the work through to completion.',
    img: { project: 'the-james-whiskey-bar', index: 2 } },
  { short: 'Finish', title: 'Finishing and handover', teaser: 'Finishes, fixtures and the final details, then the keys.',
    body: 'Finishes, fixtures and final details are completed and checked before the building is handed over.',
    img: { project: 'fioras-wine-bar', index: 2 } },
];

// ---------------------------------------------------------------- home
export function home(ctx) {
  const { config, featured, bySlug, photo, sectors, projects } = ctx;
  const h = config.hero;
  const slides = h.slides.map((s) => ({ p: bySlug[s.project], im: bySlug[s.project].images[s.index], mobile: s.mobile ? bySlug[s.project].images[s.mobile] : null }));
  const interlude = bySlug['12459-mooremeadow'];
  const ogUrl = ctx.imageSources(slides[0].im, ctx.makeUrl('')).absLarge;
  const railItems = featured.slice(0, 7);

  return page(ctx, {
    title: '',
    bodyClass: 'is-home',
    veil: true,
    overlay: true,
    ogImage: ogUrl,
    body: (url) => {
      const video = h.video;
      return `
<section class="hero" data-hero data-interval="${h.interval || 7000}" aria-label="Introduction">
  <div class="hero-media">
    ${slides.map((s, i) => {
      const d = ctx.imageSources(s.im, url);
      const m = s.mobile ? ctx.imageSources(s.mobile, url) : null;
      return `<figure class="hero-slide${i === 0 ? ' is-on' : ''}" data-slide data-project="${esc(s.p.title)}" data-href="${url.to(`projects/${s.p.slug}/`)}">
      <picture>${m ? `<source media="(max-width: 767px) and (orientation: portrait)" srcset="${m.srcset}" sizes="100vw">` : ''}
      <img src="${d.src}" srcset="${d.srcset}" sizes="100vw" width="${s.im.w}" height="${s.im.h}" alt="${esc(s.p.title)}"${i === 0 ? ' fetchpriority="high"' : ' loading="lazy"'} style="--tone:${s.im.color}"></picture>
    </figure>`;
    }).join('\n')}
    ${video ? `<video class="hero-video" data-hero-video muted playsinline loop preload="metadata" aria-hidden="true"
      data-desktop='${esc(JSON.stringify(video.desktop))}' data-mobile='${esc(JSON.stringify(video.mobile || video.desktop))}'></video>` : ''}
  </div>
  <div class="hero-shade" aria-hidden="true"></div>
  <div class="hero-brand" aria-hidden="true"><img src="${url.asset('brand/logo-light.png')}" width="1359" height="549" alt="" fetchpriority="high"></div>
  <div class="hero-copy">
    <div>
      <h1 class="hero-title">From raw ground to the <em>finished room.</em></h1>
      <p class="hero-sub">General contractor &amp; design–build · Houston, Texas</p>
    </div>
    <div class="hero-side">
      <a class="hero-credit" href="${url.to(`projects/${slides[0].p.slug}/`)}" data-hero-credit>
        <span class="label">${video ? 'Filmed on site' : 'Pictured'}</span>
        <span class="hc-name" data-hero-name>${esc(video?.project ? bySlug[video.project].title : slides[0].p.title)}</span>
      </a>
      ${video ? '' : `<div class="hero-index" data-hero-index role="tablist" aria-label="Hero photographs">${slides.map((s, i) => `<button type="button" role="tab" aria-selected="${i === 0}" aria-label="${esc(s.p.title)}"${i === 0 ? ' class="is-on"' : ''}><i></i></button>`).join('')}</div>`}
    </div>
  </div>
  <span class="hero-scroll" aria-hidden="true"></span>
  ${video ? `<ol class="hero-chapters" data-chapters aria-hidden="true">${h.chapters.map((c) => `<li data-at="${c.at}">${esc(c.label)}</li>`).join('')}</ol>
  <button class="hero-pause" type="button" data-hero-pause aria-pressed="false">Pause film</button>` : ''}
</section>

<section class="statement wrap" aria-labelledby="intro-h">
  <h2 id="intro-h" class="visually-hidden">About Nighthawk</h2>
  <p class="statement-text" data-reveal>One team from the first drawing to the final finish. Design, engineering, permits and construction, <em>under one roof.</em></p>
  <div class="statement-aside" data-reveal>
    <p>Custom homes, bars and restaurants, and commercial build-outs across Houston, carried from concept through completion by the same people.</p>
    <a class="link" href="${url.to('process/')}">How a project runs</a>
  </div>
</section>

<section class="rail" data-rail aria-labelledby="work-h">
  <div class="rail-sticky">
    <div class="rail-head"><h2 id="work-h" class="label">Selected work</h2><span class="count" data-rail-count>01 / ${pad(railItems.length)}</span></div>
    <ul class="rail-track" data-rail-track>
      ${railItems.map((p, i) => {
        const ref = RAIL_IMAGE[p.slug] ?? 0;
        const im = p.images[ref];
        const tall = im.w / im.h < 1;
        return `<li class="rail-item${tall ? ' rail-item--tall' : ''}" data-rail-item>
        <a href="${url.to(`projects/${p.slug}/`)}" data-view>
          <figure class="rail-fig">${img(ctx, url, im, { sizes: tall ? '(min-width: 1024px) 34vw, 100vw' : '(min-width: 1024px) 58vw, 100vw', alt: '' })}</figure>
          <div class="rail-cap"><span class="rail-n">${pad(i + 1)}</span><h3 class="rail-title">${esc(p.title)}</h3><p class="rail-meta">${sectorNames(ctx, p)}</p></div>
        </a>
      </li>`;
      }).join('\n')}
      <li class="rail-end"><a href="${url.to('projects/')}" data-view><span class="label">Archive</span>All ${projects.length} projects</a></li>
    </ul>
    <div class="rail-foot" aria-hidden="true"><i data-rail-bar></i></div>
  </div>
</section>

<figure class="interlude" data-parallax>
  ${img(ctx, url, interlude.images[1], { sizes: '100vw', alt: `${interlude.title}, exterior` })}
  <figcaption class="wrap"><a href="${url.to(`projects/${interlude.slug}/`)}" data-view>${esc(interlude.title)}</a><span class="label">Custom residential</span></figcaption>
</figure>

<section class="sector-index wrap" aria-labelledby="sectors-h">
  <h2 id="sectors-h" class="label section-label">By sector</h2>
  <ul class="sl" data-sector-list>
    ${Object.entries(sectors).map(([k, s], i) => {
      const n = projects.filter((p) => p.sectors.includes(k)).length;
      const im = photo(s.hero);
      const si = ctx.imageSources(im, url);
      return `<li class="sl-row" data-reveal><a href="${url.to(k + '/')}" data-preview="${si.src}">
        <span class="sl-n">${pad(i + 1)}</span>
        <span class="sl-name">${s.name}</span>
        <span class="sl-count">${n ? plural(n, 'project', 'projects') : 'Builder services'}</span>
        <span class="sl-lede">${esc(s.lede)}</span>
      </a></li>`;
    }).join('\n')}
  </ul>
  <figure class="sl-preview" data-sector-preview aria-hidden="true"><img alt=""></figure>
</section>

<section class="on-bone">
  <div class="steps wrap" aria-labelledby="steps-h">
    <h2 id="steps-h" class="label section-label">How a project runs</h2>
    <ol class="steps-row lines" data-reveal-lines>
      ${STEPS.slice(0, 4).map((s, i) => `<li><span class="step-n">${pad(i + 1)}</span><h3 class="step-t">${s.short}</h3><p>${s.teaser}</p></li>`).join('')}
    </ol>
    <p class="steps-more"><a class="link" href="${url.to('process/')}">The full process</a></p>
  </div>
  ${contactBand(ctx, url)}
</section>`;
    },
  });
}

// Which photograph each featured project shows on the homepage rail (index into its photo list).
const RAIL_IMAGE = {
  'the-james-whiskey-bar': 3,
  '12459-mooremeadow': 2,
  'fioras-wine-bar': 0,
  '7210-dearborn': 1,
  '2727-kirby': 1,
  'duo-spin-pilates': 1,
  '10135-kerrwood': 0,
};

// ---------------------------------------------------------------- projects index
export function projectsIndex(ctx) {
  const { projects, sectors, featured } = ctx;
  const rest = projects.filter((p) => !p.featured);
  const ordered = [...featured, ...rest];
  return page(ctx, {
    title: 'Projects',
    description: `Custom residences, hospitality interiors and commercial build-outs by Nighthawk Construction Group, Houston. ${projects.length} projects.`,
    body: (url) => `
<header class="page-head wrap">
  <h1 class="page-title">Projects</h1>
  <p class="page-lede">${projects.length} projects across Houston, from custom residences to <em>bars, restaurants and commercial interiors.</em></p>
  ${filters(ctx, url, null)}
</header>
<section class="wrap" aria-label="All projects">
  ${cardGrid(ctx, url, ordered)}
</section>
<section class="index wrap" aria-labelledby="index-h">
  <h2 id="index-h" class="label section-label">Index</h2>
  <div class="index-cols">
  ${Object.entries(sectors).map(([k, s]) => {
    const list = projects.filter((p) => p.sectors[0] === k);
    if (!list.length) return '';
    return `<div class="index-col"><h3 class="index-h"><a href="${url.to(k + '/')}">${s.name}</a></h3><ul>${list.map((p) => `<li><a href="${url.to(`projects/${p.slug}/`)}">${esc(p.title)}</a></li>`).join('')}</ul></div>`;
  }).join('')}
  </div>
</section>
${contactBand(ctx, url)}`,
  });
}

function filters(ctx, url, active) {
  const { sectors, projects } = ctx;
  return `<nav class="filters" aria-label="Filter by sector"><ul>
    <li><a href="${url.to('projects/')}"${active ? '' : ' aria-current="page"'}>All <span>${projects.length}</span></a></li>
    ${Object.entries(sectors).map(([k, s]) => {
      const n = projects.filter((p) => p.sectors.includes(k)).length;
      return `<li><a href="${url.to(k + '/')}"${active === k ? ' aria-current="page"' : ''}>${s.nav}${n ? ` <span>${n}</span>` : ''}</a></li>`;
    }).join('')}
  </ul></nav>`;
}

// ---------------------------------------------------------------- sector
export function sector(ctx) {
  const { sectors, projects, photo, key } = ctx;
  const s = sectors[key];
  const list = projects.filter((p) => p.sectors.includes(key)).sort((a, b) => (a.featured || 99) - (b.featured || 99) || a.order - b.order);
  const im = photo(s.hero);
  return page(ctx, {
    title: s.name,
    overlay: true,
    description: `${s.name} by Nighthawk Construction Group, Houston. ${s.lede}`,
    ogImage: ctx.imageSources(im, ctx.makeUrl('')).absLarge,
    body: (url) => `
<header class="sector-hero" data-parallax>
  <figure class="sector-hero-fig">${img(ctx, url, im, { sizes: '100vw', alt: '', eager: true })}</figure>
  <div class="sector-hero-copy wrap">
    <p class="label">${list.length ? plural(list.length, 'project', 'projects') : 'Builder services'}</p>
    <h1 class="page-title">${s.name}</h1>
    <p class="sector-lede">${esc(s.lede)}</p>
  </div>
</header>
<div class="wrap sector-filters">${filters(ctx, url, key)}</div>
${list.length ? `<section class="wrap" aria-label="${s.name} projects">${cardGrid(ctx, url, list)}</section>` : developmentBody(ctx, url)}
${contactBand(ctx, url)}`,
  });
}

function developmentBody(ctx, url) {
  return `<section class="wrap dev" aria-labelledby="dev-h">
  <h2 id="dev-h" class="dev-title" data-reveal>Working with builders and investors</h2>
  <div class="dev-text" data-reveal>
    <p>Builder services and investment properties are one of the four sectors Nighthawk serves. The same team that builds custom homes and commercial interiors handles design, drawings, permitting and construction for development work.</p>
    <p>To discuss a site, a build-to-sell project or an investment property, <a class="link" href="${url.to('contact/')}">get in touch</a>.</p>
  </div>
</section>`;
}

// ---------------------------------------------------------------- project
function block(ctx, url, p, b) {
  const fig = (i, sizes, cls = '') => {
    const im = p.images[i];
    const s = ctx.imageSources(im, url);
    return `<figure class="pf ri ${cls}" style="--r:${(im.w / im.h).toFixed(4)}" data-reveal-img><a class="zoom" href="${s.large}" data-zoom="${i}" aria-label="View photograph ${i + 1} larger">${img(ctx, url, im, { sizes, alt: altFor(p, i) })}</a><span class="pf-n" aria-hidden="true">${pad(i + 1)}</span></figure>`;
  };
  if (b.text) return p.narrative ? `<div class="b b-text wrap"><p class="narrative" data-reveal>${esc(p.narrative)}</p></div>` : '';
  if (b.full !== undefined) return `<div class="b b-full">${fig(b.full, '100vw')}</div>`;
  if (b.inset !== undefined) return `<div class="b b-inset wrap">${fig(b.inset, '(min-width: 1024px) 84vw, 100vw')}</div>`;
  if (b.offset !== undefined) return `<div class="b b-offset b-offset--${b.side || 'right'} wrap">${fig(b.offset, '(min-width: 1024px) 60vw, 92vw')}</div>`;
  if (b.detail !== undefined) return `<div class="b b-detail wrap">${fig(b.detail, '(min-width: 1024px) 34vw, 70vw')}</div>`;
  const row = b.pair || b.trio;
  const total = row.reduce((a, i) => a + p.images[i].w / p.images[i].h, 0);
  return `<div class="b b-row b-row--${row.length} wrap">${row.map((i) => fig(i, `(min-width: 1024px) ${Math.round((p.images[i].w / p.images[i].h / total) * 90)}vw, 100vw`)).join('')}</div>`;
}

export function project(ctx) {
  const { p, next } = ctx;
  const fullHero = p.cover.w >= 1200 && p.cover.w / p.cover.h >= 1.2;
  const credits = Object.entries(p.credits || {});
  return page(ctx, {
    title: p.title,
    description: p.narrative ? `${p.narrative} ${sectorNames(ctx, p)} project by Nighthawk Construction Group.` : `${p.title}: a ${sectorNames(ctx, p).toLowerCase()} project by Nighthawk Construction Group, Houston.`,
    ogImage: ctx.imageSources(p.cover, ctx.makeUrl('')).absLarge,
    bodyClass: 'is-project',
    overlay: fullHero,
    jsonld: [{
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Projects', item: `${ctx.config.url}/projects/` },
        { '@type': 'ListItem', position: 2, name: ctx.sectors[p.sectors[0]].name, item: `${ctx.config.url}/${p.sectors[0]}/` },
        { '@type': 'ListItem', position: 3, name: p.title, item: `${ctx.config.url}/projects/${p.slug}/` },
      ],
    }],
    body: (url) => {
      const cs = ctx.imageSources(p.cover, url);
      return `
<article class="project" data-gallery='${esc(JSON.stringify(p.images.map((im) => ctx.imageSources(im, url).large)))}'>
  <header class="p-hero ${fullHero ? 'p-hero--full' : 'p-hero--framed'}"${fullHero ? ' data-parallax' : ''}>
    <figure class="p-hero-fig"><a class="zoom" href="${cs.large}" data-zoom="0" aria-label="View cover photograph larger">${img(ctx, url, p.cover, { sizes: fullHero ? '100vw' : '(min-width: 1024px) 70vw, 100vw', alt: altFor(p, 0), eager: true })}</a></figure>
    <div class="p-hero-copy wrap">
      <p class="p-kicker label">${sectorNames(ctx, p)}</p>
      <h1 class="p-title">${esc(p.title)}</h1>
    </div>
  </header>
  <div class="p-meta wrap">
    <dl>
      <div><dt>Sector</dt><dd>${p.sectors.map((k) => `<a href="${url.to(k + '/')}">${ctx.sectors[k].name}</a>`).join(', ')}</dd></div>
      ${p.location ? `<div><dt>Location</dt><dd>${esc(p.location)}</dd></div>` : ''}
      ${credits.map(([k, v]) => `<div><dt>${esc(k[0].toUpperCase() + k.slice(1))}</dt><dd>${esc(v)}</dd></div>`).join('')}
    </dl>
  </div>
  <div class="p-body">
    ${p.sequence.map((b) => block(ctx, url, p, b)).join('\n    ')}
  </div>
</article>
<nav class="p-next" aria-label="Next project" data-parallax>
  <a href="${url.to(`projects/${next.slug}/`)}" data-view>
    <figure>${img(ctx, url, next.cover, { sizes: '100vw', alt: '' })}</figure>
    <span class="p-next-copy wrap"><span class="label">Next project</span><span class="p-next-title">${esc(next.title)}</span></span>
  </a>
</nav>`;
    },
  });
}

// ---------------------------------------------------------------- about
export function about(ctx) {
  const { bySlug, config, sectors } = ctx;
  const a = bySlug['12459-mooremeadow'].images[2];
  const b = bySlug['the-james-whiskey-bar'].images[1];
  const c = bySlug['7210-dearborn'].images[3];
  return page(ctx, {
    title: 'About',
    description: 'Nighthawk Construction Group is a Houston general contractor and design–build firm working across custom homes, hospitality and commercial construction.',
    body: (url) => `
<header class="page-head wrap">
  <p class="label">Houston, Texas</p>
  <h1 class="page-title">About</h1>
</header>
<section class="about wrap">
  <p class="about-lede" data-reveal>A general contractor building custom homes, bars and restaurants, and commercial interiors <em>from one studio in Houston.</em></p>
  <figure class="about-fig--a ri" data-reveal-img>${img(ctx, url, a, { sizes: '(min-width: 1024px) 30vw, 70vw', alt: '12459 Mooremeadow, fluted walnut cabinetry' })}</figure>
  <div class="about-text" data-reveal>
    <p>Nighthawk works with homeowners, restaurant and bar owners, and real-estate investors. Behind it is more than a decade of experience in investment property, project management and construction.</p>
    <p>Design, drawings, engineering, permits and construction sit with one team. Clients deal with one point of responsibility instead of coordinating separate designers, engineers and contractors, from the first concept through completion.</p>
  </div>
  <figure class="about-fig--b ri" data-reveal-img>${img(ctx, url, b, { sizes: '(min-width: 1024px) 44vw, 100vw', alt: 'The James Whiskey Bar, arched timber corridor' })}</figure>
</section>
<section class="about-sectors wrap" aria-labelledby="as-h">
  <h2 id="as-h" class="label section-label">Sectors</h2>
  <ul class="as-list">
    ${Object.entries(sectors).map(([k, s]) => `<li data-reveal><a href="${url.to(k + '/')}"><span class="as-name">${s.name}</span><span class="as-lede">${esc(s.lede)}</span></a></li>`).join('')}
  </ul>
</section>
<figure class="interlude interlude--short" data-parallax>
  ${img(ctx, url, c, { sizes: '100vw', alt: '7210 Dearborn, stair hall' })}
</figure>
<section class="about-place wrap" aria-labelledby="ap-h">
  <h2 id="ap-h" class="label section-label">Studio</h2>
  <address class="ap-address" data-reveal>${config.contact.street}<br>${config.contact.city}, ${config.contact.region} ${config.contact.postalCode}</address>
  <p class="ap-lines"><a href="mailto:${config.contact.email}">${config.contact.email}</a><br><a href="tel:${config.contact.phoneE164}">${config.contact.phone}</a></p>
</section>
${contactBand(ctx, url)}`,
  });
}

// ---------------------------------------------------------------- process
export function process(ctx) {
  const { photo } = ctx;
  return page(ctx, {
    title: 'Process',
    description: 'How a Nighthawk project runs: brief, pre-construction, design and drawings, permits, construction and handover, delivered by one design–build team.',
    body: (url) => `
<header class="page-head wrap">
  <p class="label">Six stages</p>
  <h1 class="page-title">Process</h1>
  <p class="page-lede">Design and construction under one roof. One team carries a project <em>from concept through completion.</em></p>
</header>
<ol class="process">
  ${STEPS.map((s, i) => {
    const im = photo(s.img);
    return `<li class="ps ps--${i % 2 ? 'r' : 'l'} wrap">
    <figure class="ps-fig ri" data-reveal-img>${img(ctx, url, im, { sizes: '(min-width: 1024px) 56vw, 100vw', alt: '' })}</figure>
    <div class="ps-text" data-reveal>
      <span class="step-n">${pad(i + 1)}</span>
      <h2 class="ps-title">${s.title}</h2>
      <p>${s.body}</p>
    </div>
  </li>`;
  }).join('\n')}
</ol>
${contactBand(ctx, url)}`,
  });
}

// ---------------------------------------------------------------- contact
export function contact(ctx) {
  const { config } = ctx;
  const c = config.contact;
  return page(ctx, {
    title: 'Contact',
    description: `Contact Nighthawk Construction Group in Houston: ${c.email}, ${c.phone}.`,
    body: (url) => `
<section class="contact wrap">
  <div class="contact-info">
    <p class="label">Start a project</p>
    <h1 class="page-title">Contact</h1>
    <p class="page-lede">Tell us about your site, your space <em>or your project.</em></p>
    <dl class="contact-dl">
      <div><dt>Email</dt><dd><a class="selectable" href="mailto:${c.email}">${c.email}</a></dd></div>
      <div><dt>Phone</dt><dd><a class="selectable" href="tel:${c.phoneE164}">${c.phone}</a></dd></div>
      <div><dt>Studio</dt><dd><address>${c.street}<br>${c.city}, ${c.region} ${c.postalCode}</address></dd></div>
      <div><dt>Follow</dt><dd><a href="${config.social.instagram}" rel="noopener">Instagram</a>, <a href="${config.social.facebook}" rel="noopener">Facebook</a></dd></div>
    </dl>
  </div>
  <form class="form" name="enquiry" method="POST" data-netlify="true" netlify-honeypot="company-website" data-form data-provider="${config.form.provider}" data-endpoint="${esc(config.form.endpoint)}" novalidate>
    <input type="hidden" name="form-name" value="enquiry">
    <p class="hp"><label>Leave this empty <input name="company-website" id="f-hp" tabindex="-1" autocomplete="off"></label></p>
    <div class="field"><label for="f-name">Name</label><input id="f-name" name="name" autocomplete="name" required></div>
    <div class="field"><label for="f-email">Email</label><input id="f-email" name="email" type="email" autocomplete="email" required></div>
    <div class="field"><label for="f-phone">Phone <span class="opt">optional</span></label><input id="f-phone" name="phone" type="tel" autocomplete="tel"></div>
    <div class="field"><label for="f-type">Project type</label>
      <select id="f-type" name="type">
        <option>Custom residential</option><option>Hospitality</option><option>Commercial</option><option>Development</option><option>Something else</option>
      </select></div>
    <div class="field"><label for="f-where">Site or neighbourhood <span class="opt">optional</span></label><input id="f-where" name="location"></div>
    <div class="field field--wide"><label for="f-msg">About the project</label><textarea id="f-msg" name="message" rows="6" required></textarea></div>
    <div class="form-foot">
      <button class="btn" type="submit">Send enquiry</button>
      <p class="form-status" role="status" data-form-status></p>
    </div>
  </form>
</section>`,
  });
}

// ---------------------------------------------------------------- 404
export function notFound(ctx) {
  return page(ctx, {
    title: 'Page not found',
    body: (url) => `
<section class="nf wrap">
  <h1 class="page-title">This page has moved or no longer exists.</h1>
  <p class="page-lede">The site has been rebuilt and some addresses changed. Every project is listed on the <a class="link" href="${url.to('projects/')}">projects page</a>.</p>
</section>`,
  });
}
