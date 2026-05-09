let socket = null;
let onMessage = null;
let params = null;
let reconnectTimer = null;
let pingTimer = null;
let connectTimer = null;

export function connect(userId, roomId, handler) {
    params = { userId, roomId };
    onMessage = handler;
    _open();
}

function _open() {
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
    if (pingTimer) { clearInterval(pingTimer); pingTimer = null; }
    if (connectTimer) { clearTimeout(connectTimer); connectTimer = null; }

    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    socket = new WebSocket(`${proto}://${window.location.host}/ws`);

    // Safari sometimes hangs in CONNECTING state — force retry after 5s
    connectTimer = setTimeout(() => {
        if (socket?.readyState === WebSocket.CONNECTING) {
            onMessage?.({ action: '_ws', text: 'connect timeout, retrying...' });
            socket.close();
        }
    }, 5000);

    socket.onopen = () => {
        if (connectTimer) { clearTimeout(connectTimer); connectTimer = null; }
        onMessage?.({ action: '_ws', text: 'connected, sending join' });
        socket.send(JSON.stringify({ action: 'join', ...params }));

        pingTimer = setInterval(() => {
            if (socket?.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ action: 'ping' }));
            }
        }, 20000);
    };

    socket.onmessage = (e) => {
        try { onMessage?.(JSON.parse(e.data)); } catch {}
    };

    socket.onclose = (e) => {
        if (connectTimer) { clearTimeout(connectTimer); connectTimer = null; }
        if (pingTimer) { clearInterval(pingTimer); pingTimer = null; }
        onMessage?.({ action: '_ws', text: `closed code=${e.code}, reconnecting...` });
        reconnectTimer = setTimeout(_open, 1000);
    };

    socket.onerror = () => {
        onMessage?.({ action: '_ws', text: 'error' });
    };
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
