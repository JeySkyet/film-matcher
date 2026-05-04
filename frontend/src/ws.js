let socket = null;
let onMessage = null;
let params = null;
let reconnectTimer = null;
let pingTimer = null;

export function connect(userId, roomId, handler) {
    params = { userId, roomId };
    onMessage = handler;
    _open();
}

function _open() {
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
    if (pingTimer) { clearInterval(pingTimer); pingTimer = null; }

    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    socket = new WebSocket(`${proto}://${window.location.host}/ws`);

    socket.onopen = () => {
        socket.send(JSON.stringify({ action: 'join', ...params }));

        // Keepalive: не даём браузеру заморозить соединение
        pingTimer = setInterval(() => {
            if (socket?.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ action: 'ping' }));
            }
        }, 20000);
    };

    socket.onmessage = (e) => {
        try { onMessage?.(JSON.parse(e.data)); } catch {}
    };

    socket.onclose = () => {
        if (pingTimer) { clearInterval(pingTimer); pingTimer = null; }
        reconnectTimer = setTimeout(_open, 3000);
    };

    socket.onerror = () => {};
}

// Когда телефон выходит из фона — переспрашиваем статус комнаты
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && params) {
        if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ action: 'join', ...params }));
        } else {
            _open();
        }
    }
});

function _send(data) {
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(data));
}

export const sendSwipe = (filmId, direction) => _send({ action: 'swipe', filmId, direction });
export const sendDone = () => _send({ action: 'done' });
