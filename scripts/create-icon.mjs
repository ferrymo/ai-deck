import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { app, nativeImage } from 'electron';

// Run with: pnpm exec electron scripts/create-icon.mjs
// Keep the generated source unchanged; derive all shipped sizes from it.
app.whenReady().then(async () => {
  const resources = new URL('../resources/', import.meta.url);
  const source = nativeImage.createFromPath(fileURLToPath(new URL('logo-source.png', resources)));
  if (source.isEmpty()) throw new Error('Cannot read resources/logo-source.png');

  const sizes = [16, 24, 32, 48, 64, 128, 256];
  const images = sizes.map((size) =>
    source.resize({ width: size, height: size, quality: 'best' }).toPNG(),
  );
  const header = Buffer.alloc(6 + sizes.length * 16);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);
  let offset = header.length;
  images.forEach((png, index) => {
    const entry = 6 + index * 16;
    header[entry] = sizes[index] === 256 ? 0 : sizes[index];
    header[entry + 1] = header[entry];
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(png.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });
  await mkdir(resources, { recursive: true });
  await writeFile(new URL('icon.png', resources), images.at(-1));
  await writeFile(new URL('icon.ico', resources), Buffer.concat([header, ...images]));
  console.log('Created AI Deck PNG and multi-size ICO from logo-source.png.');
  app.quit();
}).catch((error) => {
  console.error(error);
  app.exit(1);
});
