import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { chromium } from 'playwright';

// Enlever les accents et ligatures d'une chaîne
function removeAccents(str: string): string {
  return str
    .replace(/œ/g, 'oe')
    .replace(/Œ/g, 'Oe')
    .replace(/æ/g, 'ae')
    .replace(/Æ/g, 'Ae')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export const POST: RequestHandler = async ({ request }) => {
  const { url } = await request.json();

  if (!url || (!url.includes('d-bk.net') && !url.includes('dofusbook.net'))) {
    return json({ error: 'URL DofusBook invalide' }, { status: 400 });
  }

  let browser;
  try {
    // Lancer Playwright pour récupérer les items
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    console.log('Navigation vers:', url);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // Extraire les noms des items équipés
    const dofusbookItems = await page.evaluate(() => {
      const items: { name: string; imgUrl: string }[] = [];
      const allImages = document.querySelectorAll('img[src*="/static/dist/items/"]');

      const genericNames = ['boucliers', 'bottes', 'prysmaradites', 'anneaux', 'montiliers',
        'chapeaux', 'trophees', 'familiers', 'ceintures', 'volkornes', 'dragodindes',
        'muldos', 'amulettes', 'dofus', 'capes', 'haches', 'faux', 'pioches', 'marteaux',
        'pelles', 'dagues', 'arcs', 'epees', 'batons', 'baguettes', 'lances'];

      allImages.forEach(img => {
        const src = img.getAttribute('src');
        const alt = img.getAttribute('alt');

        if (src && alt && !genericNames.includes(alt.toLowerCase())) {
          // Éviter les doublons
          if (!items.find(i => i.name === alt)) {
            items.push({ name: alt, imgUrl: src });
          }
        }
      });

      return items;
    });

    await browser.close();
    browser = null;

    console.log(`${dofusbookItems.length} items trouvés sur DofusBook`);

    // Pour chaque item, chercher sur DofusDB
    const notFound: string[] = [];
    const dofusdbItems = await Promise.all(
      dofusbookItems.map(async (item) => {
        try {
          const searchName = removeAccents(item.name);
          const searchUrl = `https://api.dofusdb.fr/items?lang=fr&slug.fr[$search]=${encodeURIComponent(searchName)}&$limit=1`;
          console.log(`🔍 Recherche: "${item.name}" → "${searchName}"`);
          const response = await fetch(searchUrl);
          const data = await response.json();

          if (data.data && data.data.length > 0) {
            console.log(`  ✅ Trouvé: ${data.data[0].name?.fr || data.data[0].name}`);
            return data.data[0];
          }
          console.log(`  ❌ Non trouvé sur DofusDB`);
          notFound.push(item.name);
          return null;
        } catch (e) {
          console.error(`  ❌ Erreur recherche "${item.name}":`, e);
          notFound.push(item.name);
          return null;
        }
      })
    );

    // Filtrer les items non trouvés
    const foundItems = dofusdbItems.filter(item => item !== null);
    console.log(`\n📊 Résultat: ${foundItems.length}/${dofusbookItems.length} items trouvés sur DofusDB`);
    if (notFound.length > 0) {
      console.log(`❌ Items non trouvés: ${notFound.join(', ')}`);
    }

    return json({
      success: true,
      items: foundItems,
      total: dofusbookItems.length,
      found: foundItems.length,
      notFound
    });

  } catch (error) {
    console.error('Erreur import DofusBook:', error);
    return json({
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};
