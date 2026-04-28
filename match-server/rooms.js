const rooms = {};

function getOrCreateRoom(roomId, films) {
    if (!rooms[roomId]) {
        rooms[roomId] = { films, users: {} };
    }
    return rooms[roomId];
}

// Returns 'new' | 'reconnect'
function registerUser(roomId, userId, ws) {
    const room = rooms[roomId];
    if (room.users[userId]) {
        room.users[userId].ws = ws;
        return 'reconnect';
    }
    room.users[userId] = { ws, swipes: {}, done: false };
    return 'new';
}

// Returns matched Film or null
function recordSwipe(roomId, userId, filmId, direction) {
    const room = rooms[roomId];
    if (!room?.users[userId]) return null;

    room.users[userId].swipes[filmId] = direction;
    if (direction !== 'right') return null;

    for (const [otherId, other] of Object.entries(room.users)) {
        if (otherId === userId) continue;
        if (other.swipes[filmId] === 'right') {
            return room.films.find(f => f.id === filmId) ?? null;
        }
    }
    return null;
}

// Returns array of matched films when both users done, null otherwise
function markDone(roomId, userId) {
    const room = rooms[roomId];
    if (!room?.users[userId]) return null;

    room.users[userId].done = true;

    const users = Object.values(room.users);
    if (users.length < 2 || !users.every(u => u.done)) return null;

    const [a, b] = users;
    return room.films.filter(f => a.swipes[f.id] === 'right' && b.swipes[f.id] === 'right');
}

// Returns true if room was deleted
function removeUser(roomId, userId) {
    const room = rooms[roomId];
    if (!room) return true;
    delete room.users[userId];
    if (Object.keys(room.users).length === 0) {
        delete rooms[roomId];
        return true;
    }
    return false;
}

function getRoom(roomId) {
    return rooms[roomId] ?? null;
}

module.exports = { getOrCreateRoom, registerUser, recordSwipe, markDone, removeUser, getRoom };
