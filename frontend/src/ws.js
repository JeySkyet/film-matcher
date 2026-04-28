let socket = null;
let onMessage = null;
let params = null;
let reconnectTimer = null;

export function connect(userId, roomId, handler) {
    params = { userId, roomId };
    onMessage = handler;
    _open();
}

function _open() {
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }

    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    socket = new WebSocket(`${proto}://${window.location.hostname}:3010`);

    socket.onopen = () => {
        socket.send(JSON.stringify({ action: 'join', ...params }));
    };

    socket.onmessage = (e) => {
        try { onMessage?.(JSON.parse(e.data)); } catch {}
    };

    socket.onclose = () => {
        reconnectTimer = setTimeout(_open, 3000);
    };

    socket.onerror = () => {};
}

function _send(data) {
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(data));
}

export const sendSwipe = (filmId, direction) => _send({ action: 'swipe', filmId, direction });
export const sendDone = () => _send({ action: 'done' });
