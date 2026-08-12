// One-off icon rasterizer: rasterizes the SVG sources to PNG icon sizes using
// the pre-installed Chromium (via <canvas> drawImage, so each size is drawn
// straight from the vector source rather than downscaled from a single
// raster). Run once; the output PNGs are what ship in the PWA.
const path = require('path');
const fs = require('fs');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');

const DIR = __dirname;

async function rasterize(page, svgFile, outFile, size) {
  const svg = fs.readFileSync(path.join(DIR, svgFile), 'utf8');
  const svgDataUrl = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
  const dataUrl = await page.evaluate(async ({ svgDataUrl, size }) => {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = svgDataUrl;
    });
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, size, size);
    return canvas.toDataURL('image/png');
  }, { svgDataUrl, size });
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync(path.join(DIR, outFile), Buffer.from(base64, 'base64'));
}

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage();
  await page.setContent('<!doctype html><html><body></body></html>');

  await rasterize(page, 'icon-source.svg', 'icon-192.png', 192);
  await rasterize(page, 'icon-source.svg', 'icon-512.png', 512);
  await rasterize(page, 'maskable-source.svg', 'icon-maskable-512.png', 512);
  await rasterize(page, 'icon-source.svg', 'apple-touch-icon.png', 180);
  await rasterize(page, 'icon-source.svg', 'favicon-32.png', 32);

  await browser.close();
  console.log('done');
})();
