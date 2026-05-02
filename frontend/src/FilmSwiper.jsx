import { useState, useRef, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';
import { sendSwipe } from './ws';

export default function FilmSwiper({ films, onDone }) {
    const [index, setIndex] = useState(0);
    const [dragX, setDragX] = useState(0);
    const [flyDir, setFlyDir] = useState(null);
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
        onSwiping: ({ deltaX }) => { if (!flyingRef.current) setDragX(deltaX); },
        onSwipedLeft: () => triggerSwipe('left'),
        onSwipedRight: () => triggerSwipe('right'),
        onSwiped: () => { if (!flyingRef.current) snapBack(); },
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
            transform: `translateX(${dragX}px) rotate(${dragX * 0.035}deg)`,
            transition: snapping ? 'transform 0.22s ease' : 'none',
        };
    })();

    const labelOpacity = Math.min(Math.abs(dragX) / 80, 1);

    if (isEnd) {
        return (
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4 text-center p-6 animate-fade-in">
                <div className="text-5xl">🍿</div>
                <p className="text-white font-semibold text-lg">Вы просмотрели всё</p>
                <div className="flex gap-1.5 mt-2">
                    {[0, 1, 2].map(i => (
                        <div key={i} className="w-2 h-2 rounded-full bg-zinc-600 animate-pulse"
                            style={{ animationDelay: `${i * 0.2}s` }} />
                    ))}
                </div>
                <p className="text-zinc-500 text-sm">Ждём партнёра…</p>
            </div>
        );
    }

    const progress = ((index + 1) / films.length) * 100;

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center select-none">
            {/* Progress bar */}
            <div className="w-full h-0.5 bg-zinc-800">
                <div
                    className="h-full bg-white/30 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="flex flex-col items-center justify-between flex-1 w-full px-4 py-6 gap-6">
                {/* Counter */}
                <div className="text-zinc-600 text-xs font-medium tracking-wide">
                    {index + 1} / {films.length}
                </div>

                {/* Card */}
                <div
                    {...handlers}
                    style={{ ...cardStyle, width: 'min(85vw, 340px)', aspectRatio: '2/3' }}
                    className="relative rounded-3xl overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing flex-shrink-0"
                >
                    <img
                        src={film.poster}
                        alt={film.title}
                        className="w-full h-full object-cover"
                        draggable={false}
                    />

                    {/* ХОЧУ stamp */}
                    {dragX > 20 && (
                        <div
                            style={{ opacity: labelOpacity }}
                            className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center pointer-events-none"
                        >
                            <span className="text-emerald-400 text-4xl font-black border-4 border-emerald-400 px-4 py-1.5 rounded-xl -rotate-12 tracking-widest">
                                ХОЧУ
                            </span>
                        </div>
                    )}

                    {/* НЕТ stamp */}
                    {dragX < -20 && (
                        <div
                            style={{ opacity: labelOpacity }}
                            className="absolute inset-0 bg-red-500/20 flex items-center justify-center pointer-events-none"
                        >
                            <span className="text-red-400 text-4xl font-black border-4 border-red-400 px-4 py-1.5 rounded-xl rotate-12 tracking-widest">
                                НЕТ
                            </span>
                        </div>
                    )}

                    {/* Title gradient */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/50 to-transparent pt-16 pb-5 px-5 pointer-events-none">
                        <p className="text-white font-bold text-base leading-snug">{film.title}</p>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-8">
                    <button
                        onClick={() => triggerSwipe('left')}
                        className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center transition-all hover:bg-zinc-800 hover:scale-105 active:scale-95"
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>

                    <button
                        onClick={() => triggerSwipe('right')}
                        className="w-16 h-16 rounded-full bg-white flex items-center justify-center transition-all hover:bg-zinc-100 hover:scale-105 active:scale-95"
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="#18181b">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
