require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const USERNAME = 'jellinholl';
const OMDB_KEY = process.env.OMDB_API_KEY;
const POSTERS_DIR = path.join(__dirname, 'posters');
const WATCHLIST_PATH = path.join(__dirname, 'watchlist.json');

if (!OMDB_KEY) { console.error('OMDB_API_KEY not set in .env'); process.exit(1); }
if (!fs.existsSync(POSTERS_DIR)) fs.mkdirSync(POSTERS_DIR, { recursive: true });

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function fetchHtml(url) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return res.text();
}

function parseFilmsFromHtml(html) {
    const films = [];
    const regex = /data-item-slug="([^"]+)"[^>]*>[\s\S]*?data-item-name="([^"]+)"[\s\S]*?data-poster-url="([^"]+)"/g;
    // Letterboxd puts attributes on the same element, try simpler per-element approach
    const blocks = html.match(/<li[^>]*data-item-slug="[^"]*"[^>]*>[\s\S]*?<\/li>/g) || [];
    for (const block of blocks) {
        const slug = block.match(/data-item-slug="([^"]+)"/)?.[1];
        const name = block.match(/data-item-name="([^"]+)"/)?.[1];
        const posterUrl = block.match(/data-poster-url="([^"]+)"/)?.[1];
        if (slug && name) films.push({ slug, name, posterUrl: posterUrl || null });
    }
    // Fallback: parse attributes directly from react-component divs
    if (films.length === 0) {
        const slugs = [...html.matchAll(/data-item-slug="([^"]+)"/g)].map(m => m[1]);
        const names = [...html.matchAll(/data-item-name="([^"]+)"/g)].map(m => m[1]);
        const posters = [...html.matchAll(/data-poster-url="([^"]+)"/g)].map(m => m[1]);
        for (let i = 0; i < slugs.length; i++) {
            if (names[i]) films.push({ slug: slugs[i], name: names[i], posterUrl: posters[i] || null });
        }
    }
    return films;
}

async function getLbPosterUrl(posterPath) {
    try {
        const html = await fetchHtml(`https://letterboxd.com${posterPath}`);
        const m = html.match(/src="(https:\/\/[^"]+\.jpg[^"]*)"/);
        if (m) return m[1].replace(/-0-\d+-0-\d+-crop/, '-0-500-0-750-crop');
    } catch {}
    return null;
}

async function getOmdbPoster(title, year) {
    const search = async (params) => {
        try {
            const res = await fetch(`http://www.omdbapi.com/?${params}&apikey=${OMDB_KEY}`);
            const data = await res.json();
            if (data.Response === 'True' && data.Poster && data.Poster !== 'N/A') return data.Poster;
        } catch {}
        return null;
    };
    const t = encodeURIComponent(title);
    return (year && await search(`t=${t}&y=${year}`)) || await search(`t=${t}`);
}

function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destPath);
        const get = url.startsWith('https') ? https.get : http.get;
        get(url, { headers: { 'User-Agent': UA } }, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                file.close();
                fs.unlink(destPath, () => {});
                return downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                file.close();
                fs.unlink(destPath, () => {});
                return reject(new Error(`HTTP ${res.statusCode}`));
            }
            res.pipe(file);
            file.on('finish', () => file.close(resolve));
        }).on('error', err => { fs.unlink(destPath, () => {}); reject(err); });
    });
}

(async () => {
    // === Загружаем текущий вотчлист ===
    const existing = {};
    if (fs.existsSync(WATCHLIST_PATH)) {
        JSON.parse(fs.readFileSync(WATCHLIST_PATH, 'utf8')).forEach(f => existing[f.id] = f);
    }
    console.log(`Existing: ${Object.keys(existing).length} films`);

    // === Phase 1: Скрапим Letterboxd (чистый fetch) ===
    console.log('\n=== Phase 1: Scraping Letterboxd ===');
    const allFilms = [];
    let pageNum = 1;

    while (true) {
        const url = `https://letterboxd.com/${USERNAME}/watchlist/page/${pageNum}/`;
        process.stdout.write(`Page ${pageNum}... `);
        let html;
        try {
            html = await fetchHtml(url);
        } catch (e) {
            console.log(`error: ${e.message}`);
            break;
        }

        const films = parseFilmsFromHtml(html);
        if (films.length === 0) { console.log('no films, done.'); break; }

        allFilms.push(...films);
        console.log(`${films.length} films (total: ${allFilms.length})`);

        if (!html.includes('paginate-nextprev') || !html.includes('"next"')) break;
        pageNum++;
        await new Promise(r => setTimeout(r, 500));
    }

    console.log(`Scraped: ${allFilms.length} films`);

    // === Определяем изменения ===
    const scrapedSlugs = new Set(allFilms.map(f => f.slug));
    const added = allFilms.filter(f => !existing[f.slug]);
    const removed = Object.keys(existing).filter(id => !scrapedSlugs.has(id));

    console.log(`Changes: +${added.length} new, -${removed.length} removed`);

    if (added.length === 0 && removed.length === 0) {
        console.log('No changes. Done.');
        process.exit(0);
    }

    // === Удаляем постеры убранных фильмов ===
    for (const id of removed) {
        const p = path.join(POSTERS_DIR, `${id}.jpg`);
        if (fs.existsSync(p)) { fs.unlinkSync(p); console.log(`  ✕ removed: ${existing[id]?.title}`); }
    }

    // === Phase 2: Скачиваем постеры для новых фильмов ===
    let downloaded = 0, failed = 0;

    if (added.length > 0) {
        console.log('\n=== Phase 2: Downloading posters ===');

        for (let i = 0; i < added.length; i++) {
            const { slug, name: rawName, posterUrl } = added[i];
            const m = rawName.match(/^(.+?)\s*\((\d{4})\)$/);
            const title = m ? m[1].trim() : rawName;
            const year = m ? m[2] : (slug.match(/-(\d{4})$/)?.[1] || null);
            const posterFile = `${slug}.jpg`;
            const posterPath = path.join(POSTERS_DIR, posterFile);

            process.stdout.write(`[${i + 1}/${added.length}] ${title}... `);

            // OMDb
            const omdbUrl = await getOmdbPoster(title, year);
            if (omdbUrl) {
                try {
                    await downloadFile(omdbUrl, posterPath);
                    process.stdout.write('✓ omdb\n');
                    added[i]._title = title; added[i]._year = year; added[i]._poster = `/posters/${posterFile}`;
                    downloaded++;
                    continue;
                } catch { process.stdout.write('omdb fail → lb... '); }
            } else {
                process.stdout.write('omdb miss → lb... ');
            }

            // Letterboxd fallback
            const lbImgUrl = posterUrl ? await getLbPosterUrl(posterUrl) : null;
            if (lbImgUrl) {
                try {
                    await downloadFile(lbImgUrl, posterPath);
                    process.stdout.write('✓ letterboxd\n');
                    added[i]._title = title; added[i]._year = year; added[i]._poster = `/posters/${posterFile}`;
                    downloaded++;
                    continue;
                } catch { process.stdout.write('lb fail\n'); }
            } else {
                process.stdout.write('no image\n');
            }

            added[i]._title = title; added[i]._year = year; added[i]._poster = null;
            failed++;
            await new Promise(r => setTimeout(r, 150));
        }
        console.log(`Downloaded: ${downloaded}, Failed: ${failed}`);
    }

    // === Phase 3: Сохраняем watchlist.json ===
    const unchanged = allFilms.filter(f => existing[f.slug]).map(f => existing[f.slug]);
    const newEntries = added.map(f => ({
        id: f.slug,
        title: f._title || f.name,
        year: f._year || null,
        poster: f._poster ?? null,
    }));
    const result = [...unchanged, ...newEntries];

    fs.writeFileSync(WATCHLIST_PATH, JSON.stringify(result, null, 2), 'utf8');
    console.log(`\n✅ watchlist.json updated (${result.length} films)`);
})();
