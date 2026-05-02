const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

const USERNAME = 'jellinholl';
const BASE_URL = `https://letterboxd.com/${USERNAME}/watchlist/page/`;

function buildPosterUrl(uid, slug, cacheBustingKey) {
    const filmId = uid.replace('film:', '');
    const digits = filmId.split('').join('/');
    return `https://a.ltrbxd.com/resized/film-poster/${digits}/${filmId}-${slug}-0-500-0-750-crop.jpg?v=${cacheBustingKey}`;
}

(async () => {
    const executablePath = fs.existsSync('/usr/bin/chromium-browser')
        ? '/usr/bin/chromium-browser'
        : undefined;

    const browser = await puppeteer.launch({
        headless: true,
        ...(executablePath && { executablePath }),
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    const allMovies = [];
    let pageNum = 1;

    while (true) {
        const url = `${BASE_URL}${pageNum}/`;
        console.log(`Страница ${pageNum}: ${url}`);

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        const exists = await page.$('.film-poster').catch(() => null);
        if (!exists) { console.log('Фильмы закончились.'); break; }

        const movies = await page.evaluate(() => {
            return [...document.querySelectorAll('.react-component[data-item-slug]')].map(el => {
                const posterJson = el.getAttribute('data-resolvable-poster-path');
                let cacheBustingKey = '';
                try { cacheBustingKey = JSON.parse(posterJson)?.cacheBustingKey || ''; } catch {}

                const uid = (() => {
                    try { return JSON.parse(el.getAttribute('data-postered-identifier'))?.uid || ''; } catch { return ''; }
                })();

                return {
                    title: el.getAttribute('data-item-name') || el.getAttribute('data-item-full-display-name'),
                    href: el.getAttribute('data-item-link'),
                    slug: el.getAttribute('data-item-slug'),
                    uid,
                    cacheBustingKey,
                };
            }).filter(m => m.title && m.href);
        });

        if (movies.length === 0) break;

        for (const m of movies) {
            allMovies.push({
                title: m.title,
                url: `https://letterboxd.com${m.href}`,
                img: m.uid && m.slug ? buildPosterUrl(m.uid, m.slug, m.cacheBustingKey) : '',
            });
        }

        console.log(`  → ${movies.length} фильмов (всего: ${allMovies.length})`);

        const hasNext = await page.$('.paginate-nextprev .next');
        if (!hasNext) break;

        pageNum++;
    }

    await browser.close();

    const csv = 'Title,URL,Image\n' + allMovies
        .map(m => `"${(m.title || '').replace(/"/g, '""')}","${m.url}","${m.img}"`)
        .join('\n');

    fs.writeFileSync(path.join(__dirname, 'watchlist.csv'), csv, 'utf8');
    console.log(`\n✅ Итого: ${allMovies.length} фильмов`);
    console.log('💾 Сохранено в watchlist.csv');
})();
