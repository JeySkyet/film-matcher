import React, { useState } from 'react';
import { sendSwipe } from './ws';
import { useSwipeable } from 'react-swipeable';

export default function FilmSwiper({ films }) {
    const [index, setIndex] = useState(0);

    const handleSwipe = (direction) => {
        const current = films[index];
        sendSwipe(current.id, direction);
        setIndex((i) => i + 1);
    };

    if (index >= films.length) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-600">
                <h2 className="text-xl font-semibold mb-4">Фильмы закончились</h2>
            </div>
        );
    }

    const film = films[index];

    const swipeHandlers = useSwipeable({
        onSwipedLeft: () => handleSwipe('left'),
        onSwipedRight: () => handleSwipe('right'),
        preventScrollOnSwipe: true,
        trackMouse: true, // позволяет свайпать и мышкой
    });

    return (
        <div
            {...swipeHandlers}
            className="flex flex-col items-center justify-center min-h-screen bg-white p-6 text-center select-none"
        >
            <img
                src={film.poster}
                alt={film.title}
                className="mb-4 rounded-lg shadow-lg max-w-xs transition-transform duration-300 ease-in-out"
            />
            <h2 className="text-2xl font-bold mb-4">{film.title}</h2>

            <div className="flex space-x-6 mt-4">
                <button
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
                    onClick={() => handleSwipe('left')}
                >
                    👎 Пропустить
                </button>
                <button
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                    onClick={() => handleSwipe('right')}
                >
                    👍 Хочу смотреть
                </button>
            </div>

            <p className="text-gray-400 text-sm mt-2">(можно свайпать влево или вправо)</p>
        </div>
    );
}
