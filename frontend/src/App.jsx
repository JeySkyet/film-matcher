// App.jsx
import { useState } from 'react';
import RoomJoin from './RoomJoin';
import FilmSwiper from './FilmSwiper';
import MatchView from './MatchView';
import { connect } from './ws';

export default function App() {
    const [stage, setStage] = useState('join');
    const [films, setFilms] = useState([]);
    const [matched, setMatched] = useState(null);
    const [waitingForSecondUser, setWaitingForSecondUser] = useState(false);

    const handleJoin = (userId, roomId) => {
        setWaitingForSecondUser(true); // показываем "Ждём второго участника"

        connect(userId, roomId, (msg) => {
            console.log('WS message:', msg);

            if (msg.action === 'joined') {
                setFilms(msg.films);

                // ✅ Проверяем число пользователей в комнате:
                if (msg.usersCount < 2) {
                    setWaitingForSecondUser(true);
                } else {
                    setWaitingForSecondUser(false);
                    setStage('swipe');
                }
            } else if (msg.action === 'match') {
                setMatched(msg.film);
                setStage('match');
            }
        });
    };


    if (stage === 'join') {
        if (waitingForSecondUser) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-700">
                    <h2 className="text-xl font-semibold mb-4">Ждём второго участника...</h2>
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            );
        }

        return <RoomJoin onJoin={handleJoin} />;
    }
    if (stage === 'match') return <MatchView film={matched} />;
    return <FilmSwiper films={films} />;
}
