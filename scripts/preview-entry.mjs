// Writes dist-preview/_entry.html, the page published as the Claude artifact preview.
// The artifact host wraps the entry page in its own document skeleton (which adds safe-area padding on phones),
// so the entry only forwards to home/index.html, a plain file served like every other page.  node scripts/preview-entry.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = `<title>Nighthawk Site Preview</title>
<meta http-equiv="refresh" content="0; url=home/index.html">
<script>location.replace('home/index.html');</script>
<style>body{background:#0c0b0a;color:#e9e4da;font:16px Poppins,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0}a{color:inherit}</style>
<p><a href="home/index.html">Open the Nighthawk site preview</a></p>
`;
fs.writeFileSync(path.join(ROOT, 'dist-preview', '_entry.html'), html);
console.log('Wrote dist-preview/_entry.html');
