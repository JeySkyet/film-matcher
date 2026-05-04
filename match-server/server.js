const http = require('http');
const path = require('path');
const WebSocket = require('ws');
const fs = require('fs');
const { getOrCreateRoom, registerUser, recordSwipe, markDone, removeUser, getRoom } = require('./rooms');

const server = http.createServer();

const wss = new WebSocket.Server({ server });

function loadFilms() {
    const raw = fs.readFileSync(path.join(__dirname, '../watchlist.json'), 'utf8');
    return JSON.parse(raw);
}

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function send(ws, data) {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data));
}

function broadcast(roomId, data) {
    const room = getRoom(roomId);
    if (!room) return;
    for (const { ws } of Object.values(room.users)) send(ws, data);
}

wss.on('connection', (ws) => {
    let roomId = null;
    let userId = null;
    let leaveTimer = null;

    ws.on('message', (raw) => {
        let data;
        try { data = JSON.parse(raw); } catch { return send(ws, { error: 'invalid_json' }); }

        if (data.action === 'join') {
            if (!data.roomId || !data.userId) return send(ws, { error: 'missing_fields' });
            roomId = String(data.roomId).trim();
            userId = String(data.userId).trim();

            if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null; }

            const room = getOrCreateRoom(roomId, shuffle(loadFilms()));
            const type = registerUser(roomId, userId, ws);
            const usersCount = Object.keys(room.users).length;

            // Joining/reconnecting user always gets full message with films
            send(ws, { action: 'joined', films: room.films, usersCount });
            // Existing users get lightweight notification (no films — they already have them)
            if (type === 'new') {
                for (const [uid, user] of Object.entries(room.users)) {
                    if (uid !== userId) send(user.ws, { action: 'joined', usersCount });
                }
            }

            console.log(`[${type}] ${userId} → room ${roomId} (${usersCount} users)`);

        } else if (data.action === 'swipe') {
            if (!roomId || !userId) return;
            const matched = recordSwipe(roomId, userId, data.filmId, data.direction);
            if (matched) {
                broadcast(roomId, { action: 'match', film: matched });
                console.log(`[match] room ${roomId}: "${matched.title}"`);
            } else {
                send(ws, { action: 'swipe_ack', filmId: data.filmId });
            }

        } else if (data.action === 'ping') {
            send(ws, { action: 'pong' });

        } else if (data.action === 'done') {
            if (!roomId || !userId) return;
            const matches = markDone(roomId, userId);
            if (matches !== null) {
                broadcast(roomId, { action: 'game_over', matches });
                console.log(`[game_over] room ${roomId}: ${matches.length} matches`);
            }
        }
    });

    ws.on('close', () => {
        if (!roomId || !userId) return;
        // Wait 30s before cleanup to allow reconnect
        leaveTimer = setTimeout(() => {
            const room = getRoom(roomId);
            if (room?.users[userId]?.ws === ws) {
                const deleted = removeUser(roomId, userId);
                console.log(deleted ? `[room_deleted] ${roomId}` : `[user_left] ${userId} from ${roomId}`);
            }
        }, 30_000);
    });
});

server.listen(3010, () => {
    console.log('WS server: ws://0.0.0.0:3010');
});
