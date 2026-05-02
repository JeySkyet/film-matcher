import { useState } from 'react';
import RoomJoin from './RoomJoin';
import FilmSwiper from './FilmSwiper';
import MatchOverlay from './MatchOverlay';
import GameOver from './GameOver';
import { connect, sendDone } from './ws';

export default function App() {
    const [stage, setStage] = useState('join'); // join | waiting | swipe | game_over
    const [films, setFilms] = useState([]);
    const [matches, setMatches] = useState([]);
    const [pendingMatch, setPendingMatch] = useState(null);

    const handleJoin = (userId, roomId) => {
        setStage('waiting');
        connect(userId, roomId, (msg) => {
            if (msg.action === 'joined') {
                setFilms(msg.films);
                if (msg.usersCount >= 2) setStage('swipe');
            } else if (msg.action === 'match') {
                setMatches(prev =>
                    prev.find(f => f.id === msg.film.id) ? prev : [...prev, msg.film]
                );
                setPendingMatch(msg.film);
            } else if (msg.action === 'game_over') {
                setMatches(msg.matches);
                setStage('game_over');
            }
        });
    };

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
                        <div
                            key={i}
                            className="w-2 h-2 rounded-full bg-zinc-600 animate-pulse"
                            style={{ animationDelay: `${i * 0.2}s` }}
                        />
                    ))}
                </div>
            </div>
        );
    }

    if (stage === 'game_over') return <GameOver matches={matches} />;

    return (
        <div className="relative min-h-screen">
            <FilmSwiper films={films} onDone={sendDone} />
            {pendingMatch && (
                <MatchOverlay film={pendingMatch} onContinue={() => setPendingMatch(null)} />
            )}
        </div>
    );
}
