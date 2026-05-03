require('dotenv').config();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AdmZip = require('adm-zip');
const { parse } = require('csv-parse/sync');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

const USERNAME = process.env.LETTERBOXD_USER;
const PASSWORD = process.env.LETTERBOXD_PASS;

(async () => {
    if (!USERNAME || !PASSWORD) {
        console.error('Нужны LETTERBOXD_USER и LETTERBOXD_PASS в .env');
        process.exit(1);
    }

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Логин
    console.log('Авторизация...');
    await page.goto('https://letterboxd.com/sign-in/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('#field-username', { timeout: 10000 });
    await page.type('#field-username', USERNAME, { delay: 50 });
    await page.type('#field-password', PASSWORD, { delay: 50 });

    await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }),
        page.click('[type="submit"]'),
    ]);

    const url = page.url();
    if (url.includes('sign-in')) {
        console.error('Ошибка авторизации — проверь логин/пароль');
        await browser.close();
        process.exit(1);
    }
    console.log('Авторизован, скачиваем экспорт...');

    // Скачиваем ZIP через fetch() изнутри страницы — сессия уже активна
    console.log('Запрашиваем экспорт...');
    const base64Zip = await page.evaluate(async (exportUrl) => {
        const resp = await fetch(exportUrl, { credentials: 'include' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const buf = await resp.arrayBuffer();
        // конвертируем в base64 для передачи в Node
        let binary = '';
        const bytes = new Uint8Array(buf);
        const chunkSize = 8192;
        for (let i = 0; i < bytes.length; i += chunkSize) {
            binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
        }
        return btoa(binary);
    }, `https://letterboxd.com/${USERNAME}/watchlist/export/`);

    await browser.close();

    const zipBuffer = Buffer.from(base64Zip, 'base64');

    console.log(`ZIP скачан (${Math.round(zipBuffer.length / 1024)} КБ)`);

    // Распаковываем ZIP
    const zip = new AdmZip(zipBuffer);
    const entries = zip.getEntries();
    console.log('Файлы в архиве:', entries.map(e => e.entryName).join(', '));

    // Ищем CSV с вотчлистом (обычно watchlist.csv)
    const csvEntry = entries.find(e => e.entryName.toLowerCase().includes('watchlist') && e.entryName.endsWith('.csv'))
        || entries.find(e => e.entryName.endsWith('.csv'));

    if (!csvEntry) {
        console.error('CSV не найден в архиве');
        process.exit(1);
    }

    const csvText = csvEntry.getData().toString('utf8');
    console.log(`Парсим ${csvEntry.entryName}...`);

    // Парсим CSV
    // Letterboxd экспортирует: Date,Name,Year,Letterboxd URI,Description
    const records = parse(csvText, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
    });

    const films = records.map(r => ({
        title: r['Name'] || r['Title'] || '',
        year: r['Year'] || '',
        letterboxdUrl: r['Letterboxd URI'] || r['URL'] || '',
    })).filter(f => f.title);

    console.log(`\nНайдено фильмов: ${films.length}`);
    films.slice(0, 5).forEach(f => console.log(`  • ${f.title} (${f.year})`));
    if (films.length > 5) console.log(`  ...и ещё ${films.length - 5}`);

    // Сохраняем промежуточный результат
    fs.writeFileSync(
        path.join(__dirname, 'watchlist_raw.json'),
        JSON.stringify(films, null, 2),
        'utf8'
    );
    console.log('\n✅ Сохранено в watchlist_raw.json');
})();
