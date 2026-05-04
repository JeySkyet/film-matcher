import { useState, useRef } from 'react';
import RoomJoin from './RoomJoin';
import FilmSwiper from './FilmSwiper';
import MatchOverlay from './MatchOverlay';
import GameOver from './GameOver';
import { connect, sendDone } from './ws';

function DebugLog({ logs }) {
    return (
        <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            background: 'rgba(0,0,0,0.85)', color: '#0f0', fontFamily: 'monospace',
            fontSize: '10px', padding: '6px 8px', zIndex: 9999,
            maxHeight: '140px', overflowY: 'auto',
        }}>
            {logs.map((l, i) => <div key={i}>{l}</div>)}
        </div>
    );
}

export default function App() {
    const [stage, setStage] = useState('join');
    const [films, setFilms] = useState([]);
    const [matches, setMatches] = useState([]);
    const [pendingMatch, setPendingMatch] = useState(null);
    const [roomId, setRoomId] = useState('');
    const [logs, setLogs] = useState([]);

    const log = (msg) => {
        const t = new Date().toTimeString().slice(0, 8);
        setLogs(prev => [...prev.slice(-20), `[${t}] ${msg}`]);
    };

    const handleJoin = (userId, room) => {
        setRoomId(room);
        setStage('waiting');
        log(`joining room=${room} user=${userId}`);

        connect(userId, room, (msg) => {
            if (msg.action === '_ws') { log(`ws: ${msg.text}`); return; }
            log(`msg: ${msg.action}${msg.usersCount !== undefined ? ` users=${msg.usersCount}` : ''}${msg.film ? ` film=${msg.film.title}` : ''}`);

            if (msg.action === 'joined') {
                if (msg.films) {
                    const shuffled = [...msg.films].sort(() => Math.random() - 0.5);
                    setFilms(shuffled);
                }
                log(`usersCount=${msg.usersCount}${msg.films ? ` films=${msg.films.length}` : ''} → ${msg.usersCount >= 2 ? 'SWIPE' : 'waiting'}`);
                if (msg.usersCount >= 2) setStage('swipe');
            } else if (msg.action === 'match') {
                setMatches(prev =>
                    prev.find(f => f.id === msg.film.id) ? prev : [...prev, msg.film]
                );
                setPendingMatch(msg.film);
                setStage('match');
            } else if (msg.action === 'game_over') {
                setMatches(msg.matches);
                setStage('game_over');
            }
        });
    };

    const debug = <DebugLog logs={logs} />;

    if (stage === 'join') return <RoomJoin onJoin={handleJoin} />;

    if (stage === 'waiting') {
        return (
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-6 animate-fade-in">
                <span className="text-6xl">🎬</span>
                <div className="text-center">
                    <p className="text-white font-semibold text-lg">Ждём второго участника</p>
                    <p className="text-zinc-500 text-sm mt-1">Поделись кодом комнаты</p>
                </div>
                <div className="flex gap-1.5 mt-2">
                    {[0, 1, 2].map(i => (
                        <div key={i} className="w-2 h-2 rounded-full bg-zinc-600 animate-pulse"
                            style={{ animationDelay: `${i * 0.2}s` }} />
                    ))}
                </div>
                {debug}
            </div>
        );
    }

    if (stage === 'game_over') return <GameOver matches={matches} />;

    if (stage === 'match') {
        return (
            <MatchOverlay
                film={pendingMatch}
                onContinue={() => { setPendingMatch(null); setStage('swipe'); }}
            />
        );
    }

    return (
        <>
            <FilmSwiper films={films} onDone={sendDone} roomId={roomId} />
            {debug}
        </>
    );
}
