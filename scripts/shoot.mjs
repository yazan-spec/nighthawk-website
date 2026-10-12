// Visual QA: serves dist/ and captures full-page screenshots at desktop, tablet and phone widths.
//   node scripts/shoot.mjs [route ...]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
let chromium; try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/npm-tools/node_modules/playwright')); }
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const OUT = process.env.SHOTS || '/tmp/claude-0/shots';
fs.mkdirSync(OUT, { recursive: true });

const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.xml': 'application/xml' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(DIST, p);
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end(fs.readFileSync(path.join(DIST, '404.html'))); }
  res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(4173);

const innerHeightOf = (p) => p.viewportSize().height;
const routes = process.argv.slice(2).length ? process.argv.slice(2) : ['/'];
const sizes = (process.env.SIZES || 'desktop').split(',');
const VP = { desktop: { width: 1440, height: 900 }, tablet: { width: 820, height: 1180 }, phone: { width: 390, height: 844 } };
const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
for (const size of sizes) {
  const page = await browser.newPage({ viewport: VP[size], deviceScaleFactor: 1, isMobile: size === 'phone', hasTouch: size === 'phone' });
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  for (const r of routes) {
    await page.goto('http://localhost:4173' + r, { waitUntil: 'networkidle' });
    // scroll through so lazy images load
    const h = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < h; y += 700) { await page.evaluate((yy) => scrollTo(0, yy), y); await page.waitForTimeout(60); }
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(400);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    const name = `${size}${r.replace(/\//g, '_') || '_'}.png`;
    if (process.env.FRAMES) {
      for (const f of process.env.FRAMES.split(',')) {
        await page.evaluate((yy) => scrollTo(0, yy), Number(f) * innerHeightOf(page));
        await page.waitForTimeout(700);
        await page.screenshot({ path: path.join(OUT, `frame${f}-` + name) });
      }
    } else if (process.env.FOLD) await page.screenshot({ path: path.join(OUT, 'fold-' + name) });
    else await page.screenshot({ path: path.join(OUT, name), fullPage: true });
    console.log(name, overflow > 0 ? `OVERFLOW ${overflow}px` : 'ok', errors.splice(0).join(' | '));
  }
  await page.close();
}
await browser.close();
server.close();
