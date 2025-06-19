require('dotenv').config();
const username = process.env.LETTERBOXD_USER;
const password = process.env.LETTERBOXD_PASS;

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    await page.goto('https://letterboxd.com/sign-in/', { waitUntil: 'networkidle2' });

    await page.type('input[name="username"]', username);
    await page.type('input[name="password"]', password);

    await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);

    await page.goto('https://letterboxd.com/jellinholl/watchlist/', { waitUntil: 'networkidle2' });

    await page.waitForSelector('.film-poster');

    // 🔽 Автоскролл до конца страницы
    await autoScroll(page);

    // ⬇️ Получаем все фильмы
    const movies = await page.evaluate(() => {
        const items = [];
        document.querySelectorAll('.film-poster').forEach(el => {
            const title = el.getAttribute('data-film-name');
            const url = el.getAttribute('href');
            const img = el.querySelector('img')?.src || null;
            items.push({ title, url: `https://letterboxd.com${url}`, img });
        });
        return items;
    });

    const csv = 'Title,URL,Image\n' + movies.map(m => {
        return `"${m.title}","${m.url}","${m.img}"`;
    }).join('\n');

    fs.writeFileSync(path.join(__dirname, 'watchlist.csv'), csv, 'utf8');
    console.log(`✅ Скачано фильмов: ${movies.length}`);
    console.log('💾 Watchlist saved to watchlist.csv');

    await browser.close();
})();

// 🔁 Автоскролл вниз до полной загрузки
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
                    setTimeout(resolve, 1000); // чуть подождать после последней загрузки
                }
            }, 300);
        });
    });
}
