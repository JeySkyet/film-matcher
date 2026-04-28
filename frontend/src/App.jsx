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
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-5">
                <span className="text-6xl">🎬</span>
                <p className="text-xl font-semibold text-gray-600">Ждём второго участника…</p>
                <div className="w-10 h-10 rounded-full border-4 border-blue-400 border-t-transparent animate-spin" />
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
