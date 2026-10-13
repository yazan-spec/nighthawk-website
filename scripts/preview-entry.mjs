// Turns dist-preview/index.html into dist-preview/_entry.html, the page published as the Claude artifact preview.
// The artifact host wraps the page in its own document skeleton, so the html/head/body wrapper is stripped
// and the body class is applied by script.  node scripts/preview-entry.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(ROOT, 'dist-preview', 'index.html');
let html = fs.readFileSync(src, 'utf8');
html = html.replace(/^[\s\S]*?<head>\s*/, '');
html = html.replace(/<title>[^<]*<\/title>/, '<title>Nighthawk Site Preview</title>');
html = html.replace(/<\/head>\s*<body([^>]*)>/, (m, attrs) => {
  const cls = /class="([^"]*)"/.exec(attrs)?.[1];
  return cls ? `<script>document.body.classList.add(${JSON.stringify(cls)})</script>` : '';
});
html = html.replace(/\s*<\/body>\s*<\/html>\s*$/, '\n');
fs.writeFileSync(path.join(ROOT, 'dist-preview', '_entry.html'), html);
console.log('Wrote dist-preview/_entry.html');
