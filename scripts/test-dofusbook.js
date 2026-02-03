import { chromium } from 'playwright';

const url = 'https://www.dofusbook.net/fr/equipement/21614327-db/objets';

async function fetchDofusBookData() {
  console.log('Lancement du navigateur (headless)...');

  const browser = await chromium.launch({
    headless: true
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();

  try {
    console.log('Navigation vers:', url);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    console.log('Page chargée, titre:', await page.title());

    // Extraire les items équipés
    const data = await page.evaluate(() => {
      const items = [];

      // Chercher toutes les images d'items avec leur ID
      const allImages = document.querySelectorAll('img[src*="/static/dist/items/"]');
      allImages.forEach(img => {
        const src = img.getAttribute('src');
        const alt = img.getAttribute('alt');

        // Extraire l'ID depuis l'URL (format: /static/dist/items/{ID}-{size}.webp)
        const match = src?.match(/\/items\/(\d+)-/);
        if (match && alt) {
          // Ignorer les items génériques (catégories)
          const genericNames = ['boucliers', 'bottes', 'prysmaradites', 'anneaux', 'montiliers',
            'chapeaux', 'trophees', 'familiers', 'ceintures', 'volkornes', 'dragodindes',
            'muldos', 'amulettes', 'dofus', 'capes', 'haches', 'faux', 'pioches', 'marteaux',
            'pelles', 'dagues', 'arcs', 'epees', 'batons', 'baguettes', 'lances'];

          if (!genericNames.includes(alt.toLowerCase())) {
            items.push({
              id: parseInt(match[1]),
              name: alt,
              imgUrl: src
            });
          }
        }
      });

      // Dédupliquer par ID
      const uniqueItems = [...new Map(items.map(item => [item.id, item])).values()];

      return {
        title: document.title,
        items: uniqueItems
      };
    });

    console.log('\n=== STUFF:', data.title, '===\n');
    console.log('Items équipés:');
    data.items.forEach((item, i) => {
      console.log(`  ${i + 1}. [${item.id}] ${item.name}`);
    });
    console.log('\nTotal:', data.items.length, 'items');

    console.log('\n=== JSON ===');
    console.log(JSON.stringify(data.items, null, 2));

  } catch (error) {
    console.error('Erreur:', error.message);
  } finally {
    await browser.close();
  }
}

fetchDofusBookData();
