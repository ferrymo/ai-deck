import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Preserve the downloaded pixels. SVG masks remove the tile at render time;
// no generated/reconstructed brand geometry is used.
const root = resolve('src/renderer/src/assets/brands');
const graphite = '0 0 0 0 0.1412  0 0 0 0 0.1608  0 0 0 0 0.2078';
const originalColor = '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0';
const cutouts = [
  { id: 'codex', title: 'Codex', size: 385, rgb: graphite, alpha: '1 0 0 0 0' },
  {
    id: 'claude', title: 'Claude', size: 192,
    rgb: '0 0 0 0 0.851  0 0 0 0 0.467  0 0 0 0 0.341',
    alpha: '1.96 0 -1.96 0 0',
  },
  {
    id: 'trae', title: 'Trae', size: 48, viewBox: '4 4 40 40',
    rgb: '0 0 0 0 0.1255  0 0 0 0 0.8941  0 0 0 0 0.498',
    alpha: '-1.3 1.3 0 0 -0.01',
  },
  {
    id: 'zcode', title: 'ZCode', size: 192, viewBox: '24 24 144 144',
    rgb: graphite, alpha: '1.21 0 0 0 -0.21',
    clip: '<clipPath id="symbol"><rect x="32" y="32" width="128" height="128"/></clipPath>',
  },
  {
    id: 'antigravity-tools', title: 'Antigravity Tools', size: 256,
    rgb: originalColor, alpha: '1.5 1.5 1.5 0 -0.35',
  },
  {
    id: 'gemini', title: 'Gemini CLI', size: 1645,
    rgb: originalColor, alpha: '1.8 1.8 1.8 0 -0.7',
  },
  {
    id: 'opencode', title: 'OpenCode', size: 96, viewBox: '16 16 64 64',
    rgb: graphite, alpha: '1.08 0 0 0 -0.08',
  },
];

const manifest = JSON.parse(await readFile(resolve(root, 'sources.json'), 'utf8'));
for (const item of cutouts) {
  const original = await readFile(resolve(root, `${item.id}.png`));
  const file = `${item.id}-cutout.svg`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${item.size}" height="${item.size}" viewBox="${item.viewBox ?? `0 0 ${item.size} ${item.size}`}">
  <title>${item.title}</title>
  <defs>
    ${item.clip ?? ''}
    <filter id="cutout" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feColorMatrix type="matrix" values="${item.rgb}  ${item.alpha}"/>
      <feComposite in2="SourceAlpha" operator="in"/>
    </filter>
  </defs>
  <image width="${item.size}" height="${item.size}" href="data:image/png;base64,${original.toString('base64')}" filter="url(#cutout)"${item.clip ? ' clip-path="url(#symbol)"' : ''}/>
</svg>
`.replace(/[ \t]+$/gm, '');
  await writeFile(resolve(root, file), svg);
  const source = manifest.find((entry) => entry.file === `${item.id}.png`);
  source.displayAsset = {
    file,
    sha256: createHash('sha256').update(svg).digest('hex'),
    modification: 'Original pixels embedded with SVG alpha mask to remove background tile; no redrawn geometry. Monochrome white marks use graphite for light-surface visibility.',
  };
}
await writeFile(resolve(root, 'sources.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Prepared ${cutouts.length} transparent brand assets from unchanged originals.`);
