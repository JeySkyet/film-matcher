# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Film Matcher — Tinder для фильмов: два пользователя заходят в общую комнату и свайпают фильмы из Letterboxd-вотчлиста. Когда оба свайпнули вправо на один фильм — матч. В конце (когда оба досмотрели весь список) показывается экран со всеми совпавшими фильмами.

Два независимых сервиса:
- **`match-server/`** — Node.js WebSocket-сервер (порт 3010, WSS, на удалённом хосте)
- **`frontend/`** — React + Vite + Tailwind, деплоится по пути `/match/`

## Commands

### Frontend (`cd frontend/`)
```bash
npm run dev      # Vite dev-сервер (localhost)
npm run build    # продакшн-сборка → frontend/dist/
npm run preview  # предпросмотр продакшн-сборки
```

### WebSocket-сервер (`match-server/`)
```bash
node server.js   # требует SSL-сертификаты по хардкоженным путям в /var/www/httpd-cert/
```

### Scraper вотчлиста (корень)
```bash
# Парсит Letterboxd-вотчлист и пишет watchlist.csv (Title, URL, Image)
# Требует .env с LETTERBOXD_USER и LETTERBOXD_PASS
node watchlist.js
```

## Architecture

### Поток данных
1. `watchlist.js` скрапит Letterboxd через Puppeteer → пишет `watchlist.csv`
2. `match-server/server.js` читает `watchlist.csv` при старте через `csv-parse/sync`, хранит список в памяти
3. При создании комнаты список перемешивается (Fisher-Yates), один порядок на всю комнату
4. При джойне сервер рассылает весь перемешанный список всем участникам
5. Свайпы: клиент → сервер; сервер проверяет пересечение правых свайпов → если матч, рассылает `match` обоим
6. Когда пользователь дошёл до конца, клиент шлёт `done`; когда оба прислали `done` → сервер рассылает `game_over` со списком всех матчей
7. Комнаты удаляются через 30 сек после отключения последнего пользователя (буфер для реконнекта)

### WebSocket-протокол

| Направление | Сообщение |
|-------------|-----------|
| client → server | `{ action: 'join', userId, roomId }` |
| server → client | `{ action: 'joined', films: [...], usersCount }` |
| client → server | `{ action: 'swipe', filmId, direction }` — `direction: 'left' | 'right'` |
| server → client | `{ action: 'swipe_ack', filmId }` |
| server → client | `{ action: 'match', film }` |
| client → server | `{ action: 'done' }` |
| server → client | `{ action: 'game_over', matches: [...] }` |

### Структура комнаты на сервере (`rooms.js`)
```js
rooms[roomId] = {
    films: Film[],                         // shuffled once at room creation
    users: {
        [userId]: { ws, swipes: {}, done: false }
    }
}
```

`rooms.js` — чистый модуль без побочных эффектов. `server.js` — только транспортный слой (парсинг сообщений, broadcast, cleanup).

### Машина состояний фронтенда (`App.jsx`)
```
join → waiting → swipe → game_over
```
- `waiting` — первый пользователь ждёт второго (сервер присылает `joined` с `usersCount=1`)
- Матчи накапливаются в `matches[]` прямо во время свайпинга и показываются через `MatchOverlay` (не переключают стадию)
- Переход в `game_over` только по событию сервера, не по локальному концу списка

### Анимация карточек (`FilmSwiper.jsx`)
- `dragX` — текущее смещение при перетаскивании (без transition)
- `flyDir` — направление вылета; включает `transition: transform 0.35s ease` на вылет
- `snapping` — плавный возврат карточки если свайп не завершён (`transition: 0.2s ease`)
- Оверлеи "ХОЧУ" / "НЕТ" появляются с opacity пропорциональной `|dragX|` начиная с 20px

### Реконнект (`ws.js`)
Singleton-сокет. При `onclose` автоматически переподключается через 3 сек с теми же `userId/roomId`. Сервер при этом восстанавливает уже сделанные свайпы из памяти комнаты.

### Особенности деплоя
- Vite `base: '/match/'` — все ассеты относительно `/match/`
- SSL-сертификаты в `match-server/server.js` хардкоженны: `/var/www/httpd-cert/www-root/learning-jenya.gk-dev.ru_le1.*`
- Домен: `learning-jenya.gk-dev.ru`, сервер слушает порт `3010`
