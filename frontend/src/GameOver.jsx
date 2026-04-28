export default function GameOver({ matches }) {
    if (matches.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-4 text-center p-6">
                <span className="text-6xl">😅</span>
                <h1 className="text-2xl font-bold text-gray-700">Совпадений нет</h1>
                <p className="text-gray-400 text-sm max-w-xs">
                    Попробуйте ещё раз или обновите список фильмов
                </p>
            </div>
        );
    }

    const heading = matches.length === 1
        ? 'Одно совпадение!'
        : `${matches.length} совпадени${matches.length < 5 ? 'я' : 'й'}!`;

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            <div className="max-w-sm mx-auto px-4 pt-10">
                <div className="text-center mb-8">
                    <span className="text-5xl">🎬</span>
                    <h1 className="text-2xl font-bold text-gray-800 mt-3">{heading}</h1>
                    <p className="text-gray-400 text-sm mt-1">Вы оба хотите посмотреть:</p>
                </div>

                <div className="flex flex-col gap-3">
                    {matches.map(film => (
                        <div
                            key={film.id}
                            className="bg-white rounded-2xl shadow flex items-center gap-3 p-3 overflow-hidden"
                        >
                            <img
                                src={film.poster}
                                alt={film.title}
                                className="w-14 h-20 object-cover rounded-lg flex-shrink-0"
                            />
                            <p className="font-semibold text-gray-800 text-sm leading-snug">{film.title}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
