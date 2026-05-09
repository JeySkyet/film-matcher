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

    // Explicitly close stale socket before creating a new one
    if (socket && socket.readyState !== WebSocket.CLOSED) {
        socket.onclose = null;
        socket.close();
    }

    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    socket = new WebSocket(`${proto}://${window.location.host}/ws`);

    socket.onopen = () => {
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
        if (pingTimer) { clearInterval(pingTimer); pingTimer = null; }
        onMessage?.({ action: '_ws', text: `closed code=${e.code}, reconnecting...` });
        reconnectTimer = setTimeout(_open, 3000);
    };

    socket.onerror = () => {
        onMessage?.({ action: '_ws', text: 'error' });
    };
}

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && params) {
        if (socket?.readyState === WebSocket.OPEN) {
            // Already connected — just re-send join to sync state
            socket.send(JSON.stringify({ action: 'join', ...params }));
        } else if (!socket || socket.readyState === WebSocket.CLOSED) {
            // Connection is fully closed — reconnect
            _open();
        }
        // CONNECTING or CLOSING: let it resolve naturally, don't create a duplicate
    }
});

function _send(data) {
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(data));
}

export const sendSwipe = (filmId, direction) => _send({ action: 'swipe', filmId, direction });
export const sendDone = () => _send({ action: 'done' });
