const fs = require('fs');
const https = require('https');
const WebSocket = require('ws');

// SSL-сертификаты (замени путь, если другой)
const server = https.createServer({
    cert: fs.readFileSync('/var/www/httpd-cert/www-root/learning-jenya.gk-dev.ru_le1.crtca'),
    key: fs.readFileSync('/var/www/httpd-cert/www-root/learning-jenya.gk-dev.ru_le1.key')
});

// WebSocket-сервер поверх HTTPS
const wss = new WebSocket.Server({ server });

server.listen(3010, () => {
    console.log('WebSocket server running at wss://learning-jenya.gk-dev.ru:3010');
});

const path = require('path');
const parse = require('csv-parse/sync').parse;

function loadWatchlist() {
    const csvData = fs.readFileSync(path.join(__dirname, '../watchlist.csv'), 'utf8');
    const records = parse(csvData, {
        columns: true,
        skip_empty_lines: true
    });
    return records.map((record, index) => ({
        id: `film${index + 1}`,
        title: record.Title,
        poster: record.Image
    }));
}

const FILMS = loadWatchlist();
console.log(`✅ Loaded ${FILMS.length} films from watchlist.csv`);


const rooms = {};

function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

wss.on('connection', (ws) => {
    let currentRoomId = null;
    let currentUserId = null;

    ws.on('message', (msg) => {
        try {
            const data = JSON.parse(msg);

            if (data.action === 'join') {
                const { roomId, userId } = data;
                currentRoomId = roomId;
                currentUserId = userId;

                if (!rooms[roomId]) {
                    rooms[roomId] = { users: {}, films: shuffle([...FILMS]) };
                    console.log(`Created room ${roomId}`);
                }

                rooms[roomId].users[userId] = { ws, swipes: {} };

                const usersCount = Object.keys(rooms[roomId].users).length;
                const joinedMsg = JSON.stringify({
                    action: 'joined',
                    films: rooms[roomId].films,
                    usersCount
                });

                Object.values(rooms[roomId].users).forEach(u => {
                    u.ws.send(joinedMsg);
                });


                console.log(`User ${userId} joined room ${roomId}`);

            } else if (data.action === 'swipe') {
                const { filmId, direction } = data;
                if (!currentRoomId || !currentUserId) return;

                const room = rooms[currentRoomId];
                if (!room) return;
                const user = room.users[currentUserId];
                if (!user) return;

                user.swipes[filmId] = direction;

                if (direction === 'right') {
                    for (const [otherUserId, otherUser] of Object.entries(room.users)) {
                        if (otherUserId === currentUserId) continue;
                        if (otherUser.swipes[filmId] === 'right') {
                            const filmData = room.films.find(f => f.id === filmId);
                            const matchMsg = JSON.stringify({ action: 'match', film: filmData });

                            user.ws.send(matchMsg);
                            otherUser.ws.send(matchMsg);

                            console.log(`Match found in room ${currentRoomId} on film ${filmId}`);
                            return;
                        }
                    }
                }

                ws.send(JSON.stringify({ action: 'swipe_ack', filmId, direction }));
            } else {
                ws.send(JSON.stringify({ error: 'Unknown action' }));
            }
        } catch (e) {
            ws.send(JSON.stringify({ error: 'Invalid message format' }));
        }
    });

    ws.on('close', () => {
        if (currentRoomId && currentUserId && rooms[currentRoomId]) {
            delete rooms[currentRoomId].users[currentUserId];
            if (Object.keys(rooms[currentRoomId].users).length === 0) {
                delete rooms[currentRoomId];
                console.log(`Room ${currentRoomId} deleted`);
            }
        }
        console.log(`Connection closed for user ${currentUserId} in room ${currentRoomId}`);
    });
});
