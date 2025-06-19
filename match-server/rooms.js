const rooms = {};

function getOrCreateRoom(roomId) {
    if (!rooms[roomId]) {
        rooms[roomId] = {
            users: {},
            swipes: {},
            matchedFilmId: null,
        };
    }
    return rooms[roomId];
}

function registerUser(roomId, userId, ws) {
    const room = getOrCreateRoom(roomId);
    room.users[userId] = ws;
    room.swipes[userId] = {};
}

function handleSwipe(roomId, userId, filmId, direction) {
    const room = rooms[roomId];
    if (!room || !room.users[userId]) return;

    room.swipes[userId][filmId] = direction;

    if (direction !== 'right') return;

    const otherUserId = Object.keys(room.users).find(id => id !== userId);
    if (!otherUserId) return;

    const otherUserSwipes = room.swipes[otherUserId];
    if (otherUserSwipes?.[filmId] === 'right') {
        room.matchedFilmId = filmId;
        return filmId; // matched!
    }

    return null;
}

function broadcastMatch(roomId, film) {
    const room = rooms[roomId];
    if (!room) return;

    const payload = JSON.stringify({
        action: 'match',
        film,
    });

    Object.values(room.users).forEach(ws => {
        ws.send(payload);
    });
}

module.exports = {
    getOrCreateRoom,
    registerUser,
    handleSwipe,
    broadcastMatch,
};
