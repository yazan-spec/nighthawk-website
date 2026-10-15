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
    <img class="wm-dark" src="${url.asset('brand/logo-dark.png')}" width="1359" height="549" alt="">
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
  { key: 'commercial', name: 'Commercial Development & Tenant Build-Outs', anchor: 'commercial', img: { project: 'duo-spin-pilates', index: 2 } },
  { key: 'residential', name: 'Residential New Construction & Renovations', anchor: 'residential', img: { project: '12459-mooremeadow', index: 1 } },
  { key: 'hospitality', name: 'Restaurants, Bars & Nightclubs', anchor: 'hospitality', img: { project: 'the-james-whiskey-bar', index: 10 } },
  { key: 'development', name: 'Builder Services & Investment Properties', anchor: 'investor', img: { project: '2926-fontana', index: 0 } },
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
  const more = config.moreWork.map((slug) => bySlug[slug]);

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
    <h2 id="intro-h" class="intro-title">One team, from the first concept to the finished build.</h2>
  </div>
  <div class="intro-text" data-reveal>
    <p>Nighthawk streamlines the entire design + build process. Design, engineering, permitting and construction are handled by the same team, which means one point of accountability and no hassle of coordinating multiple contractors.</p>
    <p>We deliver across commercial, residential, hospitality and investor projects, with all your construction needs under one set of wings.</p>
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

<section class="more wrap" aria-labelledby="more-h">
  <h2 id="more-h" class="label section-label">More from the portfolio</h2>
  ${cardGrid(ctx, url, more)}
  <p class="more-end"><a class="btn" href="${url.to('projects/')}">View the full portfolio</a></p>
</section>

<section class="sectors on-bone" aria-labelledby="sectors-h">
  <div class="wrap">
    <h2 id="sectors-h" class="label section-label">Sectors we serve</h2>
    <ul class="tiles">
      ${SECTOR_TILES.map((t) => `<li class="tile" data-reveal><a href="${url.to('services/')}#${t.anchor}">
        <figure class="tile-fig">${img(ctx, url, photo(t.img), { sizes: '(min-width: 1024px) 25vw, 50vw', alt: '' })}</figure>
        <span class="tile-name">${t.name}</span>
      </a></li>`).join('\n')}
    </ul>
  </div>
</section>

${contactBand(ctx, url)}`;
    },
  });
}

// ---------------------------------------------------------------- portfolio
export function projectsIndex(ctx) {
  const { projects, featured } = ctx;
  const rest = projects.filter((p) => !p.featured);
  const ordered = [...featured, ...rest];
  return page(ctx, {
    title: 'Portfolio',
    description: 'Custom residences, restaurants and bars, and commercial build-outs by Nighthawk Construction Group, Houston.',
    body: (url) => `
<header class="page-head wrap">
  <h1 class="page-title">Portfolio</h1>
  ${filters(ctx, url, null)}
</header>
<section class="wrap" aria-label="Projects">
  ${cardGrid(ctx, url, ordered)}
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
    title: s.name,
    description: `${s.name} by Nighthawk Construction Group, Houston. ${s.lede}`,
    ogImage: ctx.imageSources(list[0].cover, ctx.makeUrl('')).absLarge,
    body: (url) => `
<header class="page-head wrap">
  <p class="label">Portfolio</p>
  <h1 class="page-title">${s.name}</h1>
  ${filters(ctx, url, key)}
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
    title: p.title,
    description: p.narrative ? `${p.narrative} ${sectorNames(ctx, p)} project by Nighthawk Construction Group.` : `${p.title}: a ${sectorNames(ctx, p).toLowerCase()} project by Nighthawk Construction Group, Houston.`,
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
// Wording adapted from nighthawkcg.com/services.
const SERVICES = [
  { id: 'design-build', title: 'Design–Build', studio: 6,
    lead: 'A true one-stop shop for residential and commercial construction.',
    body: ['Our integrated design–build process brings creative designers, skilled engineers and seasoned project managers together under one roof, so your vision is carried from concept to completion without hand-offs.',
      'Every detail is managed before the first shovel hits the ground, so construction can begin sooner and finish stronger.'],
    list: ['Interior and exterior design & architectural drawings', 'Mechanical, electrical and plumbing (MEP) engineering drawings', 'Permit acquisition and expediting to accelerate project start times'] },
  { id: 'commercial', title: 'Commercial', studio: 1,
    lead: 'Spaces that work for the business and express the brand.',
    body: ['We focus on the quality of construction and on the functionality, efficiency and brand expression of every commercial environment. From concept to completion, we deliver projects that embody your brand and support its long-term success.'],
    list: ['Office build-outs and renovations', 'Commercial tenant and retail spaces', 'Gyms and fitness centers', 'Med-spas and wellness facilities'] },
  { id: 'residential', title: 'Residential', studio: 7,
    lead: 'New construction and custom renovations, built by a team that cares.',
    body: ['Your home deserves a builder who understands how to create refined living spaces. Our design–build team combines skilled craftsmanship with decades of experience to deliver exceptional project management and stunning interiors.',
      'We source high-quality, cost-effective materials to exceed expectations and make your dream home a reality.'] },
  { id: 'hospitality', title: 'Hospitality', studio: 5,
    lead: 'Turnkey restaurants, bars and nightlife venues.',
    body: ['With a proven track record in hospitality, including owning and operating some of Houston’s most successful nightlife venues, we understand how critical first impressions are. We bring that hands-on experience, strategic insight and tailored solutions to every venue we build.',
      'Our turnkey construction concepts let you stay focused on your vision while we bring it to life with precision and efficiency.'] },
  { id: 'investor', title: 'Investor & Builder Services', studio: 2,
    lead: 'Cost-effective building strategies that maximize returns.',
    body: ['Years of hands-on real estate investing have given us a deep understanding of cost-effective building across commercial and residential projects. We partner with investors on everything from single-family homes to multi-family and commercial developments, with exclusive services for high-volume clients.',
      'Specializing in distressed properties, we apply proven strategies other contractors often overlook, helping you unlock hidden value and increase profitability.'] },
  { id: 'cabinetry', title: 'Custom Cabinetry & Displays', studio: 3,
    lead: 'Bespoke millwork that blends beauty with function.',
    body: ['We design and build custom pieces for both residential and commercial projects, from striking retail displays and reception desks to timeless kitchens, closets and baths.'] },
];

export function services(ctx) {
  const { studio } = ctx;
  return page(ctx, {
    title: 'Services',
    description: 'Design–build, commercial, residential, hospitality and investor construction services from Nighthawk Construction Group, Houston.',
    body: (url) => `
<header class="page-head wrap">
  <h1 class="page-title">Services</h1>
  <p class="page-lede">Above-and-beyond craftsmanship, from pre-construction through design, build and finishing, across commercial, residential, hospitality and investor projects.</p>
</header>
<section class="svc-intro wrap" aria-label="Our approach">
  <figure class="svc-intro-fig ri" data-reveal-img>${img(ctx, url, studio(4), { sizes: '(min-width: 1024px) 56vw, 100vw', alt: '' })}</figure>
  <div class="svc-intro-text" data-reveal>
    <p>Our mission is simple: to exceed every client’s expectations while delivering work we are truly passionate about. From initial concept through final completion, we bring the same care, precision and accountability to every project.</p>
    <p>We combine impeccable design, expert construction and hands-on project management to deliver consistent, authentic and distinctive results, managing every phase of the process ourselves.</p>
  </div>
</section>
<ol class="svc-list">
  ${SERVICES.map((s, i) => `<li class="svc svc--${i % 2 ? 'r' : 'l'} wrap" id="${s.id}">
    <figure class="svc-fig ri" data-reveal-img>${img(ctx, url, studio(s.studio), { sizes: '(min-width: 1024px) 50vw, 100vw', alt: '' })}</figure>
    <div class="svc-text" data-reveal>
      <span class="svc-n">${pad(i + 1)}</span>
      <h2 class="svc-title">${s.title}</h2>
      <p class="svc-lead">${s.lead}</p>
      ${s.body.map((t) => `<p>${t}</p>`).join('')}
      ${s.list ? `<ul class="svc-bullets">${s.list.map((t) => `<li>${t}</li>`).join('')}</ul>` : ''}
    </div>
  </li>`).join('\n')}
</ol>
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
    title: 'Contact',
    description: `Contact Nighthawk Construction Group in Houston: ${c.email}, ${c.phone}.`,
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
