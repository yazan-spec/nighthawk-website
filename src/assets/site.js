// Nighthawk — progressive enhancement only. Every page works without this file.
(() => {
  const doc = document.documentElement;
  const body = document.body;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const wide = () => innerWidth >= 1024;

  // --- every page opens at the top (unless a #section was asked for)
  try { history.scrollRestoration = 'manual'; } catch {}
  if (!location.hash) { scrollTo(0, 0); addEventListener('pageshow', () => { if (!location.hash) scrollTo(0, 0); }); }

  // --- intro veil, then page in
  const veil = document.querySelector('[data-veil]');
  const start = () => body.classList.add('ready');
  if (veil && !doc.classList.contains('no-veil') && !reduce) {
    try { sessionStorage.setItem('nh-seen', '1'); } catch {}
    setTimeout(() => { veil.classList.add('done'); start(); }, 1500);
    veil.addEventListener('animationend', (e) => { if (e.animationName === 'veil-lift') veil.remove(); });
  } else {
    veil?.remove();
    requestAnimationFrame(start);
  }

  // --- smooth scrolling (desktop, fine pointer): wheel input is eased, native scroll everywhere else
  if (fine && !reduce && innerWidth >= 1024) {
    let target = scrollY, current = scrollY, raf = 0;
    const max = () => document.documentElement.scrollHeight - innerHeight;
    const step = () => {
      current += (target - current) * 0.11;
      if (Math.abs(target - current) < 0.5) { current = target; raf = 0; } else raf = requestAnimationFrame(step);
      scrollTo(0, current);
    };
    addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.target.closest('dialog[open], .menu')) return;
      e.preventDefault();
      const d = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaMode === 2 ? e.deltaY * innerHeight : e.deltaY;
      target = Math.max(0, Math.min(max(), target + d));
      if (!raf) raf = requestAnimationFrame(step);
    }, { passive: false });
    addEventListener('scroll', () => { if (!raf) { target = current = scrollY; } }, { passive: true });
    doc.classList.add('lenis');
  }

  // --- page transitions (internal links only)
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.pathname === location.pathname || a.hasAttribute('data-zoom') || reduce) return;
    e.preventDefault();
    body.classList.add('leaving');
    setTimeout(() => { location.href = a.href; }, 420);
  });
  addEventListener('pageshow', (e) => { if (e.persisted) body.classList.remove('leaving'); });

  // --- reveals
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  document.querySelectorAll('[data-reveal], [data-reveal-img], [data-reveal-lines]').forEach((el) => io.observe(el));

  // --- parallax on full-bleed images
  const px = [...document.querySelectorAll('[data-parallax]')].map((el) => ({ el, img: el.querySelector('img') })).filter((o) => o.img);
  let pxTick = false;
  const parallax = () => {
    pxTick = false;
    const vh = innerHeight;
    for (const o of px) {
      const r = o.el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) continue;
      const t = (r.top + r.height / 2 - vh / 2) / (vh + r.height); // -0.5 .. 0.5
      o.img.style.transform = `translate3d(0, ${(t * r.height * 0.16).toFixed(1)}px, 0)`;
    }
  };
  if (px.length && !reduce) {
    addEventListener('scroll', () => { if (!pxTick) { pxTick = true; requestAnimationFrame(parallax); } }, { passive: true });
    addEventListener('resize', parallax);
    parallax();
  }

  // --- header: solid once past the opening image, tucks away while scrolling down
  const header = document.querySelector('[data-header]');
  if (header) {
    let last = scrollY, ticking = false;
    const opener = document.querySelector('.hero, .svc-hero');
    const update = () => {
      const y = scrollY;
      const limit = opener && header.hasAttribute('data-overlay') ? opener.offsetHeight - 80 : 40;
      header.classList.toggle('is-solid', y > limit);
      header.classList.toggle('is-hidden', y > 500 && y > last + 2 && !body.classList.contains('menu-open'));
      last = y; ticking = false;
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  // --- cursor: a small ring everywhere, larger over links, a magnifier over photographs
  const cursor = document.querySelector('[data-cursor]');
  if (cursor && fine && !reduce) {
    doc.classList.add('has-cursor');
    let x = -100, y = -100, cx = x, cy = y;
    addEventListener('mousemove', (e) => { x = e.clientX; y = e.clientY; cursor.classList.add('on'); }, { passive: true });
    document.addEventListener('mouseleave', () => cursor.classList.remove('on'));
    const loop = () => { cx += (x - cx) * 0.35; cy += (y - cy) * 0.35; cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`; requestAnimationFrame(loop); };
    loop();
    document.addEventListener('mouseover', (e) => { cursor.classList.toggle('big', !!e.target.closest('[data-view], .zoom, a, button')); });
  }

  // --- hero: cinematic sequence of stills (or the film, when configured)
  const hero = document.querySelector('[data-hero]');
  if (hero) {
    const video = hero.querySelector('[data-hero-video]');
    const slides = [...hero.querySelectorAll('[data-slide]')];
    const dots = [...hero.querySelectorAll('[data-hero-index] button')];
    const name = hero.querySelector('[data-hero-name]');
    const credit = hero.querySelector('[data-hero-credit]');
    const interval = Number(hero.dataset.interval) || 7000;
    let i = 0, timer = 0;
    const show = (n) => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle('is-on', k === i));
      dots.forEach((d, k) => { d.classList.toggle('is-on', k === i); d.setAttribute('aria-selected', String(k === i)); d.style.setProperty('--dur', interval + 'ms'); });
      if (name) name.textContent = slides[i].dataset.project;
      if (credit) credit.href = slides[i].dataset.href;
    };
    const play = () => { clearInterval(timer); if (!reduce && slides.length > 1) timer = setInterval(() => show(i + 1), interval); };
    dots.forEach((d, k) => d.addEventListener('click', () => { show(k); play(); }));
    document.addEventListener('visibilitychange', () => (document.hidden ? clearInterval(timer) : play()));

    if (video) {
      const small = matchMedia('(max-width: 767px) and (orientation: portrait)').matches;
      const list = JSON.parse(video.dataset[small ? 'mobile' : 'desktop'] || '[]');
      const conn = navigator.connection;
      const saveData = conn && (conn.saveData || /2g/.test(conn.effectiveType || ''));
      const chapters = [...document.querySelectorAll('[data-chapters] li')];
      const pause = hero.querySelector('[data-hero-pause]');
      if (!reduce && !saveData && list.length) {
        list.forEach((s) => { const el = document.createElement('source'); el.src = s.src; el.type = s.type; video.append(el); });
        video.load();
        video.play().then(() => { video.classList.add('is-playing'); clearInterval(timer); }).catch(() => play());
        video.addEventListener('timeupdate', () => {
          let active = 0;
          chapters.forEach((c, k) => { if (video.currentTime >= Number(c.dataset.at)) active = k; });
          chapters.forEach((c, k) => c.classList.toggle('is-active', k === active));
        });
        pause?.addEventListener('click', () => {
          const paused = !video.paused;
          paused ? video.pause() : video.play();
          pause.setAttribute('aria-pressed', String(paused));
          pause.textContent = paused ? 'Play film' : 'Pause film';
        });
      } else { pause?.remove(); play(); }
    } else {
      show(0); play();
    }
  }

  // --- selected work: stacked full-screen panels; the covered panel settles back and darkens
  const stack = document.querySelector('[data-stack]');
  if (stack) {
    const panels = [...stack.querySelectorAll('[data-panel]')];
    const count = document.querySelector('[data-stack-count]');
    let tick = false;
    const move = () => {
      tick = false;
      const vh = innerHeight;
      let active = 0;
      panels.forEach((p, i) => {
        const r = p.getBoundingClientRect();
        const next = panels[i + 1];
        if (r.top <= 1) active = i;
        if (!next || reduce) return;
        const nr = next.getBoundingClientRect();
        const covered = Math.min(1, Math.max(0, 1 - nr.top / vh)); // 0 → next panel below, 1 → fully covering
        p.querySelector('[data-panel-fig]').style.transform = `scale(${1 - covered * 0.08})`;
        p.querySelector('[data-panel-shade]').style.opacity = (covered * 0.55).toFixed(3);
      });
      if (count) count.textContent = `${String(active + 1).padStart(2, '0')} / ${String(panels.length).padStart(2, '0')}`;
    };
    addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(move); } }, { passive: true });
    addEventListener('resize', move);
    move();
  }

  // --- hero: the picture eases back as the page starts to move
  const heroMedia = document.querySelector('.hero-media');
  if (heroMedia && !reduce) {
    let t = false;
    const f = () => { t = false; const y = Math.min(scrollY, innerHeight); heroMedia.style.transform = `translate3d(0, ${(y * 0.28).toFixed(1)}px, 0) scale(${(1 + y / innerHeight * 0.06).toFixed(4)})`; };
    addEventListener('scroll', () => { if (!t) { t = true; requestAnimationFrame(f); } }, { passive: true });
  }

  // --- details strip: arrow buttons page the scroll-snap strip
  const strip = document.querySelector('[data-strip]');
  if (strip) {
    const step = () => strip.querySelector('li')?.getBoundingClientRect().width + 14 || 400;
    document.querySelector('[data-strip-prev]')?.addEventListener('click', () => strip.scrollBy({ left: -step() * 2, behavior: 'smooth' }));
    document.querySelector('[data-strip-next]')?.addEventListener('click', () => strip.scrollBy({ left: step() * 2, behavior: 'smooth' }));
  }

  // --- project gallery: a grid in reading order (left to right), each photograph spanning rows by its height
  const mas = document.querySelector('[data-masonry]');
  if (mas) {
    const unit = 8;
    const layout = () => {
      const gap = parseFloat(getComputedStyle(mas).rowGap) || 0;
      mas.querySelectorAll('li').forEach((li) => {
        const img = li.querySelector('img');
        const w = li.getBoundingClientRect().width;
        const h = w * (Number(img.getAttribute('height')) / Number(img.getAttribute('width')));
        li.style.gridRowEnd = `span ${Math.max(1, Math.round((h + gap) / (unit + gap)))}`;
      });
    };
    layout();
    addEventListener('resize', layout);
    mas.querySelectorAll('img').forEach((im) => im.addEventListener('load', layout));
  }

  // --- lightbox for project photographs
  const box = document.querySelector('[data-lightbox]');
  const gallery = document.querySelector('[data-gallery]');
  if (box && gallery && typeof box.showModal === 'function') {
    let srcs = JSON.parse(gallery.dataset.gallery || '[]');
    // No explicit gallery (the inline preview build): read each photograph from its own zoom link
    if (!srcs.length) srcs = [...document.querySelectorAll('[data-zoom]')].sort((a, b) => a.dataset.zoom - b.dataset.zoom).map((a) => a.getAttribute('href') === '#' ? a.querySelector('img')?.src : a.href);
    const img = box.querySelector('[data-lightbox-img]');
    const count = box.querySelector('[data-lightbox-count]');
    let i = 0, opener = null;
    const show = (n) => {
      i = (n + srcs.length) % srcs.length;
      img.src = srcs[i];
      img.alt = document.querySelector(`[data-zoom="${i}"] img`)?.alt || '';
      count.textContent = `${String(i + 1).padStart(2, '0')} / ${String(srcs.length).padStart(2, '0')}`;
    };
    document.addEventListener('click', (e) => {
      const a = e.target.closest('[data-zoom]');
      if (!a) return;
      e.preventDefault();
      opener = a; show(Number(a.dataset.zoom)); box.showModal();
    });
    box.querySelector('[data-lightbox-close]').addEventListener('click', () => box.close());
    box.addEventListener('click', (e) => { if (e.target === box) box.close(); });
    box.querySelector('[data-lightbox-prev]').addEventListener('click', () => show(i - 1));
    box.querySelector('[data-lightbox-next]').addEventListener('click', () => show(i + 1));
    box.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') show(i + 1); if (e.key === 'ArrowLeft') show(i - 1); });
    let sx = 0;
    box.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', (e) => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) show(i + (dx < 0 ? 1 : -1)); });
    box.addEventListener('close', () => opener?.focus());
  }

  // --- enquiry form
  const form = document.querySelector('[data-form]');
  if (form) {
    const status = form.querySelector('[data-form-status]');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      let bad = null;
      form.querySelectorAll('[required]').forEach((f) => {
        const ok = f.value.trim() && (f.type !== 'email' || /.+@.+\..+/.test(f.value));
        f.setAttribute('aria-invalid', ok ? 'false' : 'true');
        if (!ok && !bad) bad = f;
      });
      if (bad) { status.textContent = 'Add your name, a valid email address and a few words about the project, then send again.'; bad.focus(); return; }
      const provider = form.dataset.provider;
      const target = provider === 'endpoint' && form.dataset.endpoint ? form.dataset.endpoint : '/';
      const button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      status.textContent = 'Sending…';
      try {
        const res = await fetch(target, {
          method: 'POST',
          headers: provider === 'endpoint' ? { Accept: 'application/json' } : { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: provider === 'endpoint' ? new FormData(form) : new URLSearchParams(new FormData(form)).toString(),
        });
        if (!res.ok) throw new Error(String(res.status));
        form.reset();
        status.textContent = 'Enquiry sent. Thank you — the team will be in touch.';
      } catch {
        status.textContent = 'The form could not be sent from here. Email info@nighthawkcg.com or call (832) 972-7007 instead.';
      } finally { button.disabled = false; }
    });
  }
})();
