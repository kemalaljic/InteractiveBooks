// Render the app icon SVG to PNGs using the pre-installed Playwright Chromium.
// Usage: node scripts/make-icons.mjs
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { readFileSync } from 'node:fs';
const svg = readFileSync(new URL('./icon.svg', import.meta.url), 'utf8');
const browser = await chromium.launch();
const page = await browser.newPage();
for (const [size, name] of [[512, 'icon-512'], [192, 'icon-192'], [180, 'apple-touch-icon']]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
  await page.screenshot({ path: `public/icons/${name}.png`, omitBackground: false });
  console.log('✓', name);
}
await browser.close();
