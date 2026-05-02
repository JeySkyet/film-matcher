export default function GameOver({ matches }) {
    const plural = (n) => {
        if (n === 1) return 'совпадение';
        if (n >= 2 && n <= 4) return 'совпадения';
        return 'совпадений';
    };

    if (matches.length === 0) {
        return (
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-5 text-center p-6 animate-fade-in">
                <div className="text-6xl">😅</div>
                <div>
                    <h1 className="text-white text-2xl font-black tracking-tight">Совпадений нет</h1>
                    <p className="text-zinc-500 text-sm mt-2 max-w-xs mx-auto">
                        Попробуйте ещё раз или обновите список фильмов
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 animate-fade-in">
            <div className="max-w-sm mx-auto px-4 pt-12 pb-10">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="text-5xl mb-4">🎬</div>
                    <h1 className="text-white text-2xl font-black tracking-tight">
                        {matches.length} {plural(matches.length)}
                    </h1>
                    <p className="text-zinc-500 text-sm mt-2">Вы оба хотите посмотреть:</p>
                </div>

                {/* List */}
                <div className="flex flex-col gap-3">
                    {matches.map((film, i) => (
                        <div
                            key={film.id}
                            className="bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center gap-4 p-3 animate-slide-up"
                            style={{ animationDelay: `${i * 0.06}s` }}
                        >
                            <div className="w-12 h-[72px] rounded-xl overflow-hidden flex-shrink-0 bg-zinc-800">
                                <img
                                    src={film.poster}
                                    alt={film.title}
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                />
                            </div>
                            <p className="text-white font-semibold text-sm leading-snug flex-1">{film.title}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
