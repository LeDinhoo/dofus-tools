import { chromium } from 'playwright';

const url = 'https://www.dofusbook.net/fr/equipement/21592764-db/caracteristiques';

async function fetchImages() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigation vers:', url);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

  const images = await page.evaluate(() => {
    const imgs = [];
    document.querySelectorAll('img').forEach(img => {
      const src = img.getAttribute('src');
      const alt = img.getAttribute('alt') || '';
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      const classes = img.className;
      if (src && !src.includes('/static/dist/items/')) {
        imgs.push({ src, alt, width, height, classes });
      }
    });
    return imgs;
  });

  console.log('\n=== Images trouvées (hors items) ===\n');
  images.forEach((img, i) => {
    console.log((i + 1) + '. ' + img.src);
    console.log('   Alt: "' + img.alt + '"');
    console.log('   Size: ' + img.width + 'x' + img.height);
    console.log('   Classes: ' + img.classes);
    console.log('');
  });

  // Chercher aussi les canvas ou autres éléments qui pourraient contenir le perso
  const canvases = await page.evaluate(() => {
    return document.querySelectorAll('canvas').length;
  });
  console.log('Canvas trouvés:', canvases);

  // Chercher les backgrounds d'images
  const bgImages = await page.evaluate(() => {
    const bgs = [];
    document.querySelectorAll('*').forEach(el => {
      const bg = getComputedStyle(el).backgroundImage;
      if (bg && bg !== 'none' && bg.includes('url')) {
        bgs.push(bg);
      }
    });
    return [...new Set(bgs)];
  });
  console.log('\n=== Background images ===');
  bgImages.forEach(bg => console.log(bg));

  // Chercher les SVG
  const svgs = await page.evaluate(() => {
    return document.querySelectorAll('svg').length;
  });
  console.log('\n=== SVG trouvés:', svgs);

  // Chercher les iframes
  const iframes = await page.evaluate(() => {
    const frames = [];
    document.querySelectorAll('iframe').forEach(f => {
      frames.push(f.src);
    });
    return frames;
  });
  console.log('\n=== Iframes ===');
  iframes.forEach(f => console.log(f));

  // Chercher les data-* attributes qui pourraient contenir une URL d'image
  const dataAttrs = await page.evaluate(() => {
    const attrs = [];
    document.querySelectorAll('*').forEach(el => {
      for (const attr of el.attributes) {
        if (attr.name.startsWith('data-') && attr.value.includes('http')) {
          attrs.push({ name: attr.name, value: attr.value });
        }
      }
    });
    return attrs;
  });
  console.log('\n=== Data attributes avec URLs ===');
  dataAttrs.forEach(a => console.log(a.name + ':', a.value));

  // Chercher les liens de partage/preview qui pourraient contenir une image
  const metaTags = await page.evaluate(() => {
    const metas = [];
    document.querySelectorAll('meta[property*="image"], meta[name*="image"]').forEach(m => {
      metas.push({ property: m.getAttribute('property') || m.getAttribute('name'), content: m.getAttribute('content') });
    });
    return metas;
  });
  console.log('\n=== Meta tags image ===');
  metaTags.forEach(m => console.log(m.property + ':', m.content));

  // Chercher le HTML de la zone centrale (personnage)
  const characterArea = await page.evaluate(() => {
    // Chercher des éléments qui pourraient contenir le personnage
    const selectors = [
      '.character', '.perso', '.preview', '.skin', '.avatar',
      '[class*="character"]', '[class*="perso"]', '[class*="preview"]',
      '[class*="skin"]', '[class*="avatar"]', '[class*="render"]'
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        return { selector: sel, html: el.outerHTML.substring(0, 500) };
      }
    }
    return null;
  });
  console.log('\n=== Character area ===');
  console.log(characterArea);

  // Chercher les requêtes réseau faites par la page
  console.log('\n=== URL actuelle ===');
  console.log(page.url());

  await browser.close();
}

fetchImages();
