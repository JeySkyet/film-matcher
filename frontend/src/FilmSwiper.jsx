import { useState, useRef, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';
import { sendSwipe } from './ws';

export default function FilmSwiper({ films, onDone }) {
    const [index, setIndex] = useState(0);
    const [dragX, setDragX] = useState(0);
    const [flyDir, setFlyDir] = useState(null);   // 'left' | 'right' | null
    const [snapping, setSnapping] = useState(false);
    const flyingRef = useRef(false);
    const doneSentRef = useRef(false);

    const isEnd = films.length > 0 && index >= films.length;
    const film = films[index];

    useEffect(() => {
        if (isEnd && !doneSentRef.current) {
            doneSentRef.current = true;
            onDone?.();
        }
    }, [isEnd, onDone]);

    const triggerSwipe = (direction) => {
        if (flyingRef.current || !film) return;
        flyingRef.current = true;
        setSnapping(false);
        setDragX(0);
        setFlyDir(direction);
        sendSwipe(film.id, direction);
        setTimeout(() => {
            setIndex(i => i + 1);
            setFlyDir(null);
            flyingRef.current = false;
        }, 350);
    };

    const snapBack = () => {
        setSnapping(true);
        setDragX(0);
        setTimeout(() => setSnapping(false), 200);
    };

    const handlers = useSwipeable({
        onSwiping: ({ deltaX }) => {
            if (!flyingRef.current) setDragX(deltaX);
        },
        onSwipedLeft: () => triggerSwipe('left'),
        onSwipedRight: () => triggerSwipe('right'),
        onSwiped: () => {
            if (!flyingRef.current) snapBack();
        },
        trackMouse: true,
        preventScrollOnSwipe: true,
    });

    const cardStyle = (() => {
        if (flyDir) {
            const x = flyDir === 'right' ? '130vw' : '-130vw';
            const rot = flyDir === 'right' ? '20deg' : '-20deg';
            return { transform: `translateX(${x}) rotate(${rot})`, transition: 'transform 0.35s ease' };
        }
        return {
            transform: `translateX(${dragX}px) rotate(${dragX * 0.04}deg)`,
            transition: snapping ? 'transform 0.2s ease' : 'none',
        };
    })();

    const absX = Math.abs(dragX);
    const labelOpacity = Math.min(absX / 80, 1);

    if (isEnd) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-4 text-center p-6">
                <span className="text-5xl">🍿</span>
                <p className="text-lg font-semibold text-gray-600">Вы всё просмотрели</p>
                <p className="text-sm text-gray-400">Ждём результаты от партнёра…</p>
                <div className="w-6 h-6 rounded-full border-2 border-blue-400 border-t-transparent animate-spin mt-2" />
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 select-none px-4">
            {/* Progress bar */}
            <div className="w-full max-w-xs mb-5">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{index + 1} / {films.length}</span>
                </div>
                <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="h-1 bg-blue-400 rounded-full transition-all duration-300"
                        style={{ width: `${((index + 1) / films.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Card */}
            <div
                {...handlers}
                style={cardStyle}
                className="relative w-72 rounded-2xl shadow-xl overflow-hidden bg-white cursor-grab active:cursor-grabbing"
            >
                <img
                    src={film.poster}
                    alt={film.title}
                    className="w-full object-cover"
                    style={{ height: '420px' }}
                    draggable={false}
                />

                {dragX > 20 && (
                    <div
                        style={{ opacity: labelOpacity }}
                        className="absolute inset-0 bg-green-400/60 flex items-center justify-center pointer-events-none"
                    >
                        <span className="text-white text-4xl font-black -rotate-12 border-4 border-white px-3 py-1 rounded-lg">
                            ХОЧУ
                        </span>
                    </div>
                )}
                {dragX < -20 && (
                    <div
                        style={{ opacity: labelOpacity }}
                        className="absolute inset-0 bg-red-400/60 flex items-center justify-center pointer-events-none"
                    >
                        <span className="text-white text-4xl font-black rotate-12 border-4 border-white px-3 py-1 rounded-lg">
                            НЕТ
                        </span>
                    </div>
                )}

                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4 pointer-events-none">
                    <p className="text-white font-semibold text-base leading-snug">{film.title}</p>
                </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-10 mt-8">
                <button
                    onClick={() => triggerSwipe('left')}
                    className="w-16 h-16 rounded-full bg-white shadow-lg text-3xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
                >
                    👎
                </button>
                <button
                    onClick={() => triggerSwipe('right')}
                    className="w-16 h-16 rounded-full bg-white shadow-lg text-3xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
                >
                    👍
                </button>
            </div>
        </div>
    );
}
