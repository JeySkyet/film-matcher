const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const WATCHLIST_URL = 'https://letterboxd.com/jellinholl/watchlist/';

(async () => {
    const executablePath = fs.existsSync('/usr/bin/chromium-browser')
        ? '/usr/bin/chromium-browser'
        : undefined;

    const browser = await puppeteer.launch({
        headless: 'new',
        ...(executablePath && { executablePath }),
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    console.log('Открываю вотчлист...');
    await page.goto(WATCHLIST_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('.film-poster', { timeout: 30000 });

    console.log('Скроллю страницу...');
    await autoScroll(page);

    const movies = await page.evaluate(() => {
        return [...document.querySelectorAll('.film-poster')].map(el => ({
            title: el.getAttribute('data-film-name'),
            url: `https://letterboxd.com${el.getAttribute('href')}`,
            img: el.querySelector('img')?.src || '',
        }));
    });

    const csv = 'Title,URL,Image\n' + movies
        .map(m => `"${m.title}","${m.url}","${m.img}"`)
        .join('\n');

    fs.writeFileSync(path.join(__dirname, 'watchlist.csv'), csv, 'utf8');
    console.log(`✅ Скачано фильмов: ${movies.length}`);
    console.log('💾 Сохранено в watchlist.csv');

    await browser.close();
})();

async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 500;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;
                if (totalHeight >= scrollHeight - window.innerHeight) {
                    clearInterval(timer);
                    setTimeout(resolve, 1500);
                }
            }, 300);
        });
    });
}
