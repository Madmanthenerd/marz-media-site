// Branded social share images (Open Graph, 1200x630): what shows when a page link is
// texted, DMed or posted. Rendered at build time: page photo + dark fade + wordmark + headline.
// If the photo can't be fetched (or rendering fails), the caller keeps the plain photo instead.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const require = createRequire(import.meta.url);
const font = (pkg, file) => fs.readFileSync(require.resolve(`@fontsource/${pkg}/files/${file}`));
const FONTS = [
  { name: 'Fraunces', data: font('fraunces', 'fraunces-latin-400-normal.woff'), weight: 400, style: 'normal' },
  { name: 'Manrope', data: font('manrope', 'manrope-latin-500-normal.woff'), weight: 500, style: 'normal' },
  { name: 'Manrope', data: font('manrope', 'manrope-latin-700-normal.woff'), weight: 700, style: 'normal' },
];

const h = (type, style, ...children) => ({ type, props: { style, children: children.length === 1 ? children[0] : children } });

async function photo(url) {
  if (!url) return null;
  const sized = url.replace(/\/v1\/fill\/w_\d+,h_\d+/, '/v1/fill/w_1200,h_630');
  try {
    const res = await fetch(sized, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    return `data:image/jpeg;base64,${Buffer.from(await res.arrayBuffer()).toString('base64')}`;
  } catch { return null; }
}

export async function renderOg({ title, eyebrow, image, out }) {
  const bg = await photo(image);
  const tree = h('div', { width: 1200, height: 630, display: 'flex', position: 'relative', background: '#07090E', fontFamily: 'Manrope' },
    bg ? { type: 'img', props: { src: bg, width: 1200, height: 630, style: { position: 'absolute', top: 0, left: 0, width: 1200, height: 630, objectFit: 'cover' } } } : h('div', { display: 'flex' }, ''),
    h('div', { position: 'absolute', top: 0, left: 0, width: 1200, height: 630, display: 'flex', backgroundImage: 'linear-gradient(90deg, rgba(7,9,14,0.92) 0%, rgba(7,9,14,0.72) 48%, rgba(7,9,14,0.15) 100%)' }, ''),
    h('div', { position: 'absolute', top: 0, left: 0, width: 1200, height: 630, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '56px 64px' },
      h('div', { display: 'flex', alignItems: 'center', color: '#fff', fontSize: 26, letterSpacing: 8, fontWeight: 700 },
        'MARZ', h('span', { fontWeight: 500, opacity: 0.6, marginLeft: 14 }, 'MEDIA')),
      h('div', { display: 'flex', flexDirection: 'column', maxWidth: 760 },
        h('div', { display: 'flex', width: 64, height: 4, background: '#5B7BC4', marginBottom: 24 }, ''),
        h('div', { display: 'flex', color: 'rgba(238,241,246,0.8)', fontSize: 22, letterSpacing: 4, fontWeight: 700, textTransform: 'uppercase', marginBottom: 14 }, eyebrow),
        h('div', { display: 'flex', color: '#fff', fontFamily: 'Fraunces', fontSize: title.length > 34 ? 58 : 68, lineHeight: 1.08 }, title)),
      h('div', { display: 'flex', color: 'rgba(238,241,246,0.85)', fontSize: 22, fontWeight: 500 }, 'marzmediaphotography.com  ·  346-533-4026')));
  const svg = await satori(tree, { width: 1200, height: 630, fonts: FONTS });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, png);
  return { photo: !!bg };
}
