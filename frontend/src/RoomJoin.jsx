import { useState } from 'react';

const s = {
    page: {
        minHeight: '100svh',
        background: '#09090b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: "'Inter', -apple-system, sans-serif",
    },
    card: {
        width: '100%',
        maxWidth: '300px',
    },
    header: {
        textAlign: 'center',
        marginBottom: '40px',
    },
    emoji: {
        fontSize: '52px',
        lineHeight: 1,
        marginBottom: '16px',
    },
    title: {
        color: '#ffffff',
        fontSize: '26px',
        fontWeight: '900',
        margin: '0 0 6px',
        letterSpacing: '-0.5px',
    },
    subtitle: {
        color: '#52525b',
        fontSize: '13px',
        margin: 0,
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    label: {
        display: 'block',
        color: '#52525b',
        fontSize: '11px',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: '6px',
    },
    input: {
        width: '100%',
        background: '#18181b',
        border: '1.5px solid #27272a',
        borderRadius: '12px',
        padding: '13px 16px',
        color: '#ffffff',
        fontSize: '16px',
        outline: 'none',
        boxSizing: 'border-box',
        transition: 'border-color 0.15s',
        WebkitAppearance: 'none',
    },
    inputFocus: {
        borderColor: '#52525b',
    },
    btn: (active) => ({
        width: '100%',
        background: active ? '#ffffff' : '#27272a',
        color: active ? '#09090b' : '#3f3f46',
        fontWeight: '700',
        fontSize: '15px',
        padding: '14px',
        borderRadius: '12px',
        border: 'none',
        cursor: active ? 'pointer' : 'not-allowed',
        marginTop: '4px',
        transition: 'background 0.15s, color 0.15s',
        letterSpacing: '-0.1px',
    }),
};

export default function RoomJoin({ onJoin }) {
    const [userId, setUserId] = useState('');
    const [roomId, setRoomId] = useState('');
    const [focus, setFocus] = useState(null);

    const canJoin = userId.trim() && roomId.trim();
    const submit = () => canJoin && onJoin(userId.trim(), roomId.trim());

    return (
        <div style={s.page}>
            <div style={s.card}>
                <div style={s.header}>
                    <div style={s.emoji}>🎬</div>
                    <h1 style={s.title}>Film Matcher</h1>
                    <p style={s.subtitle}>Найдите фильм вместе</p>
                </div>

                <div style={s.form}>
                    <div>
                        <label style={s.label}>Ваше имя</label>
                        <input
                            style={{ ...s.input, ...(focus === 'user' ? s.inputFocus : {}) }}
                            placeholder="Например: Женя"
                            value={userId}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck="false"
                            onFocus={() => setFocus('user')}
                            onBlur={() => setFocus(null)}
                            onChange={e => setUserId(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && submit()}
                        />
                    </div>

                    <div>
                        <label style={s.label}>Код комнаты</label>
                        <input
                            style={{ ...s.input, ...(focus === 'room' ? s.inputFocus : {}) }}
                            placeholder="Например: 1234"
                            value={roomId}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck="false"
                            onFocus={() => setFocus('room')}
                            onBlur={() => setFocus(null)}
                            onChange={e => setRoomId(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && submit()}
                        />
                    </div>

                    <button
                        style={s.btn(canJoin)}
                        disabled={!canJoin}
                        onClick={submit}
                    >
                        Войти в комнату
                    </button>
                </div>
            </div>
        </div>
    );
}
