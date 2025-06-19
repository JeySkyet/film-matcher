let socket;

export function connect(userId, roomId, onMessage) {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.hostname;
    const port = 3010;

    socket = new WebSocket(`${protocol}://${host}:${port}`);

    socket.onopen = () => {
        console.log('WebSocket connected');
        socket.send(JSON.stringify({
            action: 'join',
            userId,
            roomId
        }));
    };

    socket.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        console.log('Message from server:', msg);
        onMessage(msg);
    };

    socket.onerror = (err) => {
        console.error('WebSocket error:', err);
    };

    socket.onclose = () => {
        console.warn('WebSocket closed');
    };
}

export function sendSwipe(filmId, direction) {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        console.error('WebSocket not ready');
        return;
    }

    socket.send(JSON.stringify({
        action: 'swipe',
        filmId,
        direction
    }));
}
