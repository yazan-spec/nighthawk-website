// Page templates. Plain template literals; every page is rendered to static HTML at build time.

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const pad = (n) => String(n).padStart(2, '0');

// ---------------------------------------------------------------- image
function img(ctx, url, im, { sizes = '100vw', alt = '', eager = false, cls = '', fit = '' } = {}) {
  const small = /\(min-width: \d+px\) (?:[1-4]\d|50)vw/.test(sizes);
  const s = ctx.imageSources(im, url, { small });
  return `<img class="${cls}" src="${s.src}"${s.srcset ? ` srcset="${s.srcset}" sizes="${sizes}"` : ""} width="${im.w}" height="${im.h}"` +
    ` alt="${esc(alt)}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async"` +
    ` style="--tone:${im.color}${fit ? `;object-position:${fit}` : ''}">`;
}

const altFor = (p, i) => (p.alts && p.alts[i]) || `${p.title}, photograph ${p.images[i].n}`;

// ---------------------------------------------------------------- shell
function head(ctx, url, { title, description, ogImage, route, jsonld = [] }) {
  const { config } = ctx;
  const full = title ? `${title} | ${config.name}` : `${config.name} | Houston General Contractor & Design-Build Firm`;
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
    knowsAbout: ['General contracting', 'Design-build', 'Custom home construction', 'Home renovation', 'Restaurant and bar construction', 'Commercial tenant build-outs', 'Investor and builder services', 'Custom cabinetry and millwork'],
    hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Construction services', itemListElement: [
      'Design-build services', 'Residential new construction and renovations', 'Commercial construction and tenant build-outs',
      'Restaurant, bar and hospitality construction', 'Investor and builder services', 'Custom cabinetry and displays',
    ].map((name) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name, areaServed: 'Houston, TX' } })) },
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
<meta name="theme-color" content="#141210">
<link rel="icon" href="${url.asset('favicon.svg')}" type="image/svg+xml">
<link rel="preload" href="${url.asset('fonts/poppins-light.woff')}" as="font" type="font/woff" crossorigin>
<link rel="preload" href="${url.asset('fonts/poppins-medium.woff')}" as="font" type="font/woff" crossorigin>
<link rel="preload" href="${url.asset('fonts/poppins-regular.woff')}" as="font" type="font/woff" crossorigin>
<link rel="stylesheet" href="${url.asset('assets/site.css')}?v=${ctx.hash}">
<script type="application/ld+json">${JSON.stringify([org, ...jsonld])}</script>
<script>document.documentElement.classList.add('js');try{if(sessionStorage.getItem('nh-seen'))document.documentElement.classList.add('no-veil')}catch(e){}</script>
</head>`;
}

const NAV = [
  ['', 'Home'],
  ['projects/', 'Portfolio'],
  ['services/', 'Services'],
  ['contact/', 'Contact'],
];

function header(ctx, url, { route, overlay }) {
  const { config, sectors } = ctx;
  const current = (r) => (route === r || (r === 'projects/' && (route.startsWith('projects') || sectors[route.replace('/', '')])) ? ' aria-current="page"' : '');
  return `<a class="skip" href="#main">Skip to content</a>
<header class="site-header${overlay ? ' over-dark' : ''}" data-header${overlay ? ' data-overlay' : ''}>
  <a class="wordmark" href="${url.to('')}" aria-label="${esc(config.name)}, home">
    <img class="wm-light" src="${url.asset('brand/logo-light.png')}" width="1359" height="549" alt="">
  </a>
  <nav class="nav" aria-label="Primary">
    <ul>${NAV.map(([r, l]) => `<li><a href="${url.to(r)}"${current(r)}>${l}</a></li>`).join('')}</ul>
  </nav>
  <button class="menu-btn" type="button" aria-expanded="false" aria-controls="menu" data-menu-btn>
    <span class="menu-btn-label">Menu</span>
  </button>
</header>
<div class="menu" id="menu" data-menu hidden>
  <nav class="menu-inner" aria-label="Menu">
    <ul class="menu-main">
      ${NAV.map(([r, l]) => `<li><a href="${url.to(r)}">${l}</a></li>`).join('')}
    </ul>
    <p class="menu-contact">
      <a class="selectable" href="mailto:${config.contact.email}">${config.contact.email}</a><br>
      <a class="selectable" href="tel:${config.contact.phoneE164}">${config.contact.phone}</a><br>
      ${config.contact.street}, ${config.contact.city}, ${config.contact.region} ${config.contact.postalCode}
    </p>
  </nav>
</div>`;
}

function footer(ctx, url) {
  const { config } = ctx;
  const c = config.contact;
  return `<footer class="site-footer">
  <div class="wrap footer-grid">
    <div class="footer-brand"><img src="${url.asset('brand/logo-light.png')}" width="1359" height="549" alt="${esc(config.name)}" loading="lazy"></div>
    <div class="footer-col fc-1">
      <p class="label">Contact</p>
      <p><a href="mailto:${c.email}">${c.email}</a><br><a href="tel:${c.phoneE164}">${c.phone}</a></p>
      <address>${c.street}<br>${c.city}, ${c.region} ${c.postalCode}</address>
    </div>
    <nav class="footer-col fc-2" aria-label="Site">
      <p class="label">Site</p>
      <ul>${NAV.map(([r, l]) => `<li><a href="${url.to(r)}">${l}</a></li>`).join('')}</ul>
    </nav>
    <nav class="footer-col fc-3" aria-label="Follow">
      <p class="label">Follow</p>
      <ul><li><a href="${config.social.instagram}" rel="noopener">Instagram</a></li><li><a href="${config.social.facebook}" rel="noopener">Facebook</a></li></ul>
    </nav>
  </div>
  <p class="wrap footer-legal"><span>© ${new Date().getFullYear()} ${config.name}</span><span>General Construction · Project Management · Design + Build</span><span>Houston, Texas</span></p>
</footer>`;
}

function page(ctx, { title, description, ogImage, body, jsonld, bodyClass = '', veil = false, overlay = false }) {
  const url = ctx.makeUrl(ctx.page);
  const route = ctx.page.replace(/index\.html$/, '').replace(/^404\.html$/, '404');
  return `${head(ctx, url, { title, description, ogImage, route, jsonld })}
<body class="${bodyClass}">
${veil ? `<div class="veil" data-veil aria-hidden="true"><img class="veil-mark" src="${url.asset('brand/logo-light.png')}" width="1359" height="549" alt=""><span class="veil-rule"></span></div>` : ''}
${header(ctx, url, { route, overlay })}
<main id="main">
${body(url)}
</main>
${footer(ctx, url)}
<dialog class="lightbox" data-lightbox aria-label="Photograph viewer">
  <img alt="" data-lightbox-img>
  <p class="lb-count" data-lightbox-count></p>
  <button class="lb-close" type="button" data-lightbox-close aria-label="Close"><span>Close</span> ×</button>
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

function card(ctx, url, p) {
  return `<li class="card" data-reveal>
  <a href="${url.to(`projects/${p.slug}/`)}" data-view>
    <figure class="card-fig">${img(ctx, url, p.cover, { sizes: '(min-width: 1024px) 33vw, (min-width: 600px) 50vw, 100vw', alt: '' })}</figure>
    <div class="card-cap"><h3 class="card-title">${esc(p.title)}</h3><p class="card-meta">${sectorNames(ctx, p)}</p></div>
  </a>
</li>`;
}

function cardGrid(ctx, url, list) {
  return `<ul class="cards">${list.map((p) => card(ctx, url, p)).join('\n')}</ul>`;
}

function contactBand(ctx, url) {
  const c = ctx.config.contact;
  return `<section class="cta" aria-labelledby="cta-h">
  <div class="wrap cta-grid">
    <div data-reveal>
      <h2 id="cta-h" class="cta-title">Let us bring your vision to life.</h2>
      <p class="cta-text">Tell us about the site, the space or the building you have in mind, and a member of our team will reach out.</p>
    </div>
    <div class="cta-side" data-reveal>
      <p class="cta-lines"><a href="mailto:${c.email}">${c.email}</a><br><a href="tel:${c.phoneE164}">${c.phone}</a></p>
      <a class="btn" href="${url.to('contact/')}">Contact us</a>
    </div>
  </div>
</section>`;
}

// The four sectors Nighthawk serves (wording from nighthawkcg.com), each linking to its part of the Services page.
const SECTOR_TILES = [
  { key: 'commercial', name: 'Commercial Development & Tenant Build-Outs', anchor: 'commercial', img: { project: 'duo-coffee', index: 0 }, alt: 'Commercial construction in Houston: DUO Coffee building exterior' },
  { key: 'residential', name: 'Residential New Construction & Renovations', anchor: 'residential', img: { project: '12459-mooremeadow', index: 4 }, alt: 'Custom home construction in Houston: walnut and marble kitchen at 12459 Mooremeadow' },
  { key: 'hospitality', name: 'Restaurants, Bars & Nightclubs', anchor: 'hospitality', img: { project: 'the-james-whiskey-bar', index: 0 }, alt: 'Restaurant and bar construction in Houston: The James Whiskey Bar' },
  { key: 'development', name: 'Builder Services & Investment Properties', anchor: 'investor', img: { project: '1703-reverse', index: 0 }, alt: 'Spec home built for investors in Houston: 1703 Reverse exterior' },
];

const STEPS = [
  { title: 'Brief', body: 'The site, the program, the budget and the timeline, understood before anything is drawn.' },
  { title: 'Pre-construction', body: 'Scope, cost and schedule settled on paper, so decisions are made before they become expensive on site.' },
  { title: 'Design & drawings', body: 'Interior and exterior design, architectural drawings and MEP engineering, produced in-house.' },
  { title: 'Permits', body: 'Permit acquisition and expediting handled for you, so construction can begin sooner.' },
  { title: 'Construction', body: 'One team managing the trades, the schedule and the quality of the work.' },
  { title: 'Finishing & handover', body: 'Finishes, fixtures and the final details, checked before the keys are handed over.' },
];

// ---------------------------------------------------------------- home
export function home(ctx) {
  const { config, bySlug, photo } = ctx;
  const h = config.hero;
  const slides = h.slides.map((s) => ({ p: bySlug[s.project], im: bySlug[s.project].images[s.index], mobile: s.mobile ? bySlug[s.project].images[s.mobile] : null }));
  const ogUrl = ctx.imageSources(slides[0].im, ctx.makeUrl('')).absLarge;
  const panels = config.featured.map((f) => ({ p: bySlug[f.project], im: bySlug[f.project].images[f.index] }));
  const details = config.details.map(([title, n]) => ({ im: ctx.photoN(title, n), p: ctx.projects.find((q) => q.title === title) }));

  return page(ctx, {
    title: '',
    description: 'Nighthawk Construction Group is a Houston general contractor and design-build firm: custom homes and renovations, restaurant and bar construction, commercial tenant build-outs and investor services, from concept to completion.',
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
      <picture>${m ? `<source media="(max-width: 767px) and (orientation: portrait)" srcset="${m.src}">` : ''}
      <img src="${d.src}"${d.srcset ? ` srcset="${d.srcset}" sizes="100vw"` : ""} width="${s.im.w}" height="${s.im.h}" alt="${esc(s.p.title)}"${i === 0 ? ' fetchpriority="high"' : ' loading="lazy"'} style="--tone:${s.im.color}"></picture>
    </figure>`;
    }).join('\n')}
    ${video ? `<video class="hero-video" data-hero-video muted playsinline loop preload="metadata" aria-hidden="true"
      data-desktop='${esc(JSON.stringify(video.desktop))}' data-mobile='${esc(JSON.stringify(video.mobile || video.desktop))}'></video>` : ''}
  </div>
  <div class="hero-shade" aria-hidden="true"></div>
  <div class="hero-copy">
    <div>
      <h1 class="hero-title">Turn your vision <em>into a reality.</em></h1>
      <p class="hero-sub">General Construction · Project Management · Design + Build</p>
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

<section class="intro wrap" aria-labelledby="intro-h">
  <div class="intro-lead" data-reveal>
    <p class="label">Nighthawk Construction Group · Houston, Texas</p>
    <h2 id="intro-h" class="intro-title">One team, from concept to the finished product.</h2>
  </div>
  <div class="intro-text" data-reveal>
    <p>Nighthawk Construction Group is a Houston general contractor and design-build firm. Design, engineering, permitting and construction are handled by the same team, which means one point of accountability and none of the hassle of coordinating multiple contractors.</p>
    <p>We build custom homes and renovations, restaurants and bars, and commercial spaces across Houston, with all your construction needs under one set of wings.</p>
    <ul class="intro-links">
      <li><a class="link" href="${url.to('projects/')}">See our portfolio</a></li>
      <li><a class="link" href="${url.to('services/')}">View our services</a></li>
      <li><a class="link" href="${url.to('contact/')}">Contact us</a></li>
    </ul>
  </div>
</section>

<section aria-labelledby="work-h">
  <div class="stack-head wrap"><h2 id="work-h" class="label">Selected work</h2><span class="count" data-stack-count>01 / ${pad(panels.length)}</span></div>
  <div class="stack" data-stack>
    ${panels.map(({ p, im }, i) => `<article class="panel" data-panel>
      <a href="${url.to(`projects/${p.slug}/`)}" data-view>
        <figure data-panel-fig>${img(ctx, url, im, { sizes: '100vw', alt: '', eager: i === 0 })}</figure>
        <div class="panel-cap">
          <div><span class="panel-n">${pad(i + 1)} / ${pad(panels.length)}</span><h3 class="panel-title">${esc(p.title)}</h3><p class="panel-meta">${sectorNames(ctx, p)}</p></div>
          <span class="panel-view">View project</span>
        </div>
        <span class="panel-shade" data-panel-shade aria-hidden="true"></span>
      </a>
    </article>`).join('\n')}
  </div>
</section>

<section class="details" aria-labelledby="details-h">
  <div class="wrap details-head"><h2 id="details-h" class="label">Details</h2><p class="details-note">Hand-picked photographs from across the portfolio</p></div>
  <div class="strip-wrap">
  <button class="strip-btn strip-btn--prev" type="button" data-strip-prev aria-label="Previous photographs"></button>
  <button class="strip-btn strip-btn--next" type="button" data-strip-next aria-label="Next photographs"></button>
  <ul class="strip" data-strip>
    ${details.map(({ im, p }) => `<li><a href="${url.to(`projects/${p.slug}/`)}" data-view>${img(ctx, url, im, { sizes: '(min-width: 1024px) 38vw, 82vw', alt: `${p.title}, ${sectorNames(ctx, p).toLowerCase()} construction detail by Nighthawk, Houston` })}<span class="strip-cap">${esc(p.title)}</span></a></li>`).join('\n    ')}
  </ul>
  </div>
  <p class="more-end wrap"><a class="btn" href="${url.to('projects/')}">View the full portfolio</a></p>
</section>

<section class="sectors on-bone" aria-labelledby="sectors-h">
  <div class="wrap">
    <h2 id="sectors-h" class="label section-label">Sectors we serve</h2>
    <ul class="tiles">
      ${SECTOR_TILES.map((t) => `<li class="tile" data-reveal><a href="${url.to('services/')}#${t.anchor}">
        <figure class="tile-fig">${img(ctx, url, photo(t.img), { sizes: '(min-width: 1024px) 25vw, 50vw', alt: t.alt })}</figure>
        <span class="tile-name">${t.name}</span>
      </a></li>`).join('\n')}
    </ul>
  </div>
</section>

<section class="seo wrap" aria-labelledby="seo-h">
  <h2 id="seo-h" class="seo-title" data-reveal>A Houston general contractor for custom homes, restaurants and commercial spaces.</h2>
  <div class="seo-text" data-reveal>
    <p>Based in Houston, Texas, Nighthawk Construction Group works with homeowners, restaurant and bar owners, business owners and real estate investors. As a design-build contractor we take projects from architectural drawings and MEP engineering through permitting, construction and finishing, so a new custom home, a whole-house renovation, a restaurant build-out or a commercial tenant improvement is delivered by one accountable team.</p>
    <p>Backed by more than a decade of experience in investment properties, project management and construction, we bring proven problem-solving and a hands-on approach to every project, from spec homes for investors to high-end hospitality interiors.</p>
  </div>
</section>

${contactBand(ctx, url)}`;
    },
  });
}

// ---------------------------------------------------------------- portfolio
export function projectsIndex(ctx) {
  const { projects } = ctx;
  return page(ctx, {
    title: 'Portfolio: Custom Homes, Restaurants & Commercial Construction in Houston',
    description: 'A portfolio of Houston construction projects by Nighthawk Construction Group: custom homes and renovations, restaurants, bars and cafés, and commercial build-outs, all delivered design-build.',
    body: (url) => `
<header class="page-head wrap">
  <h1 class="page-title">Portfolio</h1>
  <p class="page-lede">Custom homes, restaurants and bars, and commercial spaces across Houston, built by one design-build team.</p>
</header>
<section class="wrap" aria-label="Projects">
  ${cardGrid(ctx, url, projects)}
</section>
${contactBand(ctx, url)}`,
  });
}

function filters(ctx, url, active) {
  const { sectors, projects } = ctx;
  const keys = Object.keys(sectors).filter((k) => projects.some((p) => p.sectors.includes(k)));
  return `<nav class="filters" aria-label="Filter by sector"><ul>
    <li><a href="${url.to('projects/')}"${active ? '' : ' aria-current="page"'}>All</a></li>
    ${keys.map((k) => `<li><a href="${url.to(k + '/')}"${active === k ? ' aria-current="page"' : ''}>${sectors[k].nav}</a></li>`).join('')}
  </ul></nav>`;
}

// ---------------------------------------------------------------- sector
export function sector(ctx) {
  const { sectors, projects, key } = ctx;
  const s = sectors[key];
  const list = projects.filter((p) => p.sectors.includes(key)).sort((a, b) => (a.featured || 99) - (b.featured || 99) || a.order - b.order);
  return page(ctx, {
    title: `${s.name} Construction in Houston`,
    description: `${s.name} projects by Nighthawk Construction Group, a Houston general contractor and design-build firm. ${s.lede}`,
    ogImage: ctx.imageSources(list[0].cover, ctx.makeUrl('')).absLarge,
    body: (url) => `
<header class="page-head wrap">
  <p class="p-crumb"><a class="link" href="${url.to('projects/')}">Portfolio</a></p>
  <h1 class="page-title">${s.name}</h1>
  <p class="page-lede">${esc(s.lede)}</p>
</header>
<section class="wrap" aria-label="${s.name} projects">${cardGrid(ctx, url, list)}</section>
${contactBand(ctx, url)}`,
  });
}

// ---------------------------------------------------------------- project
export function project(ctx) {
  const { p, next, prev } = ctx;
  const credits = Object.entries(p.credits || {});
  const all = [...p.images, ...p.extras];
  return page(ctx, {
    title: `${p.title} | ${sectorNames(ctx, p)} Construction in Houston`,
    description: `${p.title}: ${p.narrative ? p.narrative + ' ' : ''}A ${sectorNames(ctx, p).toLowerCase()} project built design-build by Nighthawk Construction Group, Houston general contractor.`,
    ogImage: ctx.imageSources(p.cover, ctx.makeUrl('')).absLarge,
    bodyClass: 'is-project',
    jsonld: [{
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Portfolio', item: `${ctx.config.url}/projects/` },
        { '@type': 'ListItem', position: 2, name: ctx.sectors[p.sectors[0]].name, item: `${ctx.config.url}/${p.sectors[0]}/` },
        { '@type': 'ListItem', position: 3, name: p.title, item: `${ctx.config.url}/projects/${p.slug}/` },
      ],
    }],
    body: (url) => {
      const cs = ctx.imageSources(p.cover, url);
      return `
<article class="project" data-gallery='${esc(JSON.stringify(all.map((im) => ctx.imageSources(im, url).large).filter((u) => u !== '#')))}'>
  <header class="p-head wrap">
    <p class="p-crumb"><a class="link" href="${url.to('projects/')}">Portfolio</a> <span>/</span> <a class="link" href="${url.to(p.sectors[0] + '/')}">${ctx.sectors[p.sectors[0]].name}</a></p>
    <h1 class="p-title">${esc(p.title)}</h1>
    ${p.narrative ? `<p class="p-narrative">${esc(p.narrative)}</p>` : ''}
    ${credits.length || p.location ? `<dl class="p-meta">${p.location ? `<div><dt>Location</dt><dd>${esc(p.location)}</dd></div>` : ''}${credits.map(([k, v]) => `<div><dt>${esc(k[0].toUpperCase() + k.slice(1))}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
  </header>
  <figure class="p-cover wrap" data-reveal-img>
    <a class="zoom" href="${cs.large}" data-zoom="0" aria-label="View cover photograph larger">${img(ctx, url, p.cover, { sizes: '(min-width: 1024px) 86vw, 100vw', alt: altFor(p, 0), eager: true })}</a>
  </figure>
  <section class="p-gallery wrap" aria-label="Photographs">
    <ul class="masonry">
      ${all.slice(1).map((im, k) => { const s = ctx.imageSources(im, url); const i = k + 1; return `<li data-reveal><a class="zoom" href="${s.large}" data-zoom="${i}" aria-label="View photograph ${i + 1} larger">${img(ctx, url, im, { sizes: '(min-width: 1024px) 42vw, 100vw', alt: `${p.title}, photograph ${i + 1}` })}</a></li>`; }).join('\n      ')}
    </ul>
  </section>
</article>
<nav class="p-nav wrap" aria-label="Other projects">
  <a class="p-nav-link p-nav-prev" href="${url.to(`projects/${prev.slug}/`)}" data-view><span class="label">Previous</span><span class="p-nav-title">${esc(prev.title)}</span></a>
  <a class="p-nav-all btn" href="${url.to('projects/')}">All projects</a>
  <a class="p-nav-link p-nav-next" href="${url.to(`projects/${next.slug}/`)}" data-view><span class="label">Next</span><span class="p-nav-title">${esc(next.title)}</span></a>
</nav>`;
    },
  });
}

// ---------------------------------------------------------------- services
// Wording adapted from nighthawkcg.com/services. Each service is one full-screen panel of the reel.
const SERVICES = [
  { id: 'design-build', title: 'Design–Build', img: (ctx) => ctx.studio(8), kicker: 'One roof, one team',
    lead: 'A true one-stop shop for residential and commercial construction in Houston.',
    body: 'Creative designers, skilled engineers and seasoned project managers work together under one roof, so your vision is carried from concept to completion without hand-offs. Every detail is managed before the first shovel hits the ground, so construction begins sooner and finishes stronger.',
    list: ['Interior and exterior design & architectural drawings', 'Mechanical, electrical and plumbing (MEP) engineering drawings', 'Permit acquisition and expediting'] },
  { id: 'residential', title: 'Residential', img: (ctx) => ctx.bySlug['12459-mooremeadow'].images[4], kicker: 'New construction & renovations',
    lead: 'Custom homes and whole-house renovations, built by a team that cares.',
    body: 'Your home deserves a builder who understands how to create refined living spaces. We combine skilled craftsmanship with decades of experience to deliver exceptional project management and stunning interiors, sourcing high-quality, cost-effective materials to make your dream home a reality.' },
  { id: 'commercial', title: 'Commercial', img: (ctx) => ctx.bySlug['duo-coffee'].images[0], kicker: 'Development & tenant build-outs',
    lead: 'Spaces that work for the business and express the brand.',
    body: 'We focus on the quality of construction and on the functionality, efficiency and brand expression of every commercial environment, delivering projects that embody your brand and support its long-term success.',
    list: ['Office build-outs and renovations', 'Commercial tenant and retail spaces', 'Gyms, fitness centers, med-spas and wellness facilities'] },
  { id: 'hospitality', title: 'Hospitality', img: (ctx) => ctx.bySlug['the-james-whiskey-bar'].images[0], kicker: 'Restaurants, bars & nightclubs',
    lead: 'Turnkey venues from a team that has owned and operated them.',
    body: 'With a proven track record in hospitality, including some of Houston’s most successful nightlife venues, we understand how critical first impressions are. Our turnkey construction concepts let you stay focused on your opening while we bring the room to life with precision and efficiency.' },
  { id: 'investor', title: 'Investor & Builder Services', img: (ctx) => ctx.bySlug['1703-reverse'].images[0], kicker: 'Spec homes & investment properties',
    lead: 'Cost-effective building strategies that maximize returns.',
    body: 'Years of hands-on real estate investing have given us a deep understanding of cost-effective building. We partner with investors on everything from spec homes and single-family builds to multi-family and commercial developments, with exclusive services for high-volume clients and proven strategies for distressed properties.' },
  { id: 'cabinetry', title: 'Custom Cabinetry & Displays', img: (ctx) => ctx.bySlug['12459-mooremeadow'].images[10], kicker: 'Bespoke millwork',
    lead: 'Millwork that blends beauty with function.',
    body: 'We design and build custom pieces for residential and commercial projects alike, from striking retail displays and reception desks to timeless kitchens, closets and baths.' },
];

export function services(ctx) {
  return page(ctx, {
    title: 'Construction Services in Houston: Design-Build, Residential, Commercial & Hospitality',
    description: 'Nighthawk Construction Group’s services in Houston: design-build with in-house drawings and MEP engineering, custom home construction and renovations, commercial tenant build-outs, restaurant and bar construction, investor and builder services, and custom cabinetry.',
    overlay: true,
    body: (url) => `
<header class="svc-hero" aria-label="Services">
  <figure class="svc-hero-fig">${img(ctx, url, ctx.studio(9), { sizes: '100vw', alt: 'Houston skyline at dusk', eager: true })}</figure>
  <div class="svc-hero-copy wrap">
    <p class="label">Services · Houston, Texas</p>
    <h1 class="page-title">Above-and-beyond craftsmanship, <em>from concept to completion.</em></h1>
    <p class="page-lede">Our mission is simple: to exceed every client’s expectations while delivering work we are truly passionate about. Design, construction and hands-on project management, every phase handled by one team.</p>
  </div>
  <ol class="svc-index" aria-label="Services on this page">${SERVICES.map((s, i) => `<li><a href="#${s.id}"><span>${pad(i + 1)}</span>${s.title}</a></li>`).join('')}</ol>
</header>
<div class="stack-head wrap"><h2 class="label">What we do</h2><span class="count" data-stack-count>01 / ${pad(SERVICES.length)}</span></div>
<div class="stack" data-stack>
  ${SERVICES.map((s, i) => `<section class="panel panel--svc" data-panel id="${s.id}" aria-labelledby="${s.id}-h">
    <figure data-panel-fig>${img(ctx, url, s.img(ctx), { sizes: '100vw', alt: '' })}</figure>
    <div class="svc-copy wrap">
      <p class="svc-kicker"><span class="svc-n">${pad(i + 1)} / ${pad(SERVICES.length)}</span>${s.kicker}</p>
      <h2 id="${s.id}-h" class="svc-title">${s.title}</h2>
      <p class="svc-lead">${s.lead}</p>
      <p class="svc-body">${s.body}</p>
      ${s.list ? `<ul class="svc-bullets">${s.list.map((t) => `<li>${t}</li>`).join('')}</ul>` : ''}
    </div>
    <span class="panel-shade" data-panel-shade aria-hidden="true"></span>
  </section>`).join('\n  ')}
</div>
<section class="steps on-bone" aria-labelledby="steps-h">
  <div class="wrap">
    <h2 id="steps-h" class="label section-label">How a project runs</h2>
    <ol class="steps-row lines" data-reveal-lines>
      ${STEPS.map((s, i) => `<li><span class="step-n">${pad(i + 1)}</span><h3 class="step-t">${s.title}</h3><p>${s.body}</p></li>`).join('')}
    </ol>
  </div>
</section>
${contactBand(ctx, url)}`,
  });
}

// ---------------------------------------------------------------- contact
export function contact(ctx) {
  const { config } = ctx;
  const c = config.contact;
  return page(ctx, {
    title: 'Contact a Houston General Contractor',
    description: `Contact Nighthawk Construction Group, Houston general contractor and design-build firm, about a custom home, renovation, restaurant or commercial project: ${c.email}, ${c.phone}.`,
    body: (url) => `
<section class="contact wrap">
  <div class="contact-info">
    <h1 class="page-title">Contact</h1>
    <p class="page-lede">Let us bring your vision to life. Fill out the form and a member of our team will reach out to assist with your project.</p>
    <dl class="contact-dl">
      <div><dt>Email</dt><dd><a class="selectable" href="mailto:${c.email}">${c.email}</a></dd></div>
      <div><dt>Phone</dt><dd><a class="selectable" href="tel:${c.phoneE164}">${c.phone}</a></dd></div>
      <div><dt>Office</dt><dd><address>${c.street}<br>${c.city}, ${c.region} ${c.postalCode}</address></dd></div>
      <div><dt>Follow</dt><dd><a href="${config.social.instagram}" rel="noopener">Instagram</a>, <a href="${config.social.facebook}" rel="noopener">Facebook</a></dd></div>
    </dl>
  </div>
  <form class="form" name="enquiry" method="POST" data-netlify="true" netlify-honeypot="company-website" data-form data-provider="${config.form.provider}" data-endpoint="${esc(config.form.endpoint)}" novalidate>
    <input type="hidden" name="form-name" value="enquiry">
    <p class="hp"><label>Leave this empty <input name="company-website" id="f-hp" tabindex="-1" autocomplete="off"></label></p>
    <div class="field"><label for="f-name">Name</label><input id="f-name" name="name" autocomplete="name" required></div>
    <div class="field"><label for="f-email">Email</label><input id="f-email" name="email" type="email" autocomplete="email" required></div>
    <div class="field"><label for="f-phone">Phone</label><input id="f-phone" name="phone" type="tel" autocomplete="tel" required></div>
    <div class="field"><label for="f-type">Project type</label>
      <select id="f-type" name="type">
        <option>Residential</option><option>Commercial</option><option>Hospitality</option><option>Investor / builder services</option><option>Other</option>
      </select></div>
    <div class="field field--wide"><label for="f-msg">Message</label><textarea id="f-msg" name="message" rows="6" required></textarea></div>
    <div class="form-foot">
      <button class="btn" type="submit">Send</button>
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
  <p class="page-lede">Every project is listed in the <a class="link" href="${url.to('projects/')}">portfolio</a>, and our services are described <a class="link" href="${url.to('services/')}">here</a>.</p>
</section>`,
  });
}
