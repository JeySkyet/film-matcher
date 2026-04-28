export default function MatchOverlay({ film, onContinue }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xs overflow-hidden animate-pop-in">
                <div className="bg-gradient-to-r from-green-400 to-emerald-500 px-6 py-5 text-center">
                    <p className="text-white text-2xl font-black">🎉 Совпадение!</p>
                    <p className="text-green-100 text-sm mt-1">Вы оба хотите посмотреть</p>
                </div>
                <div className="p-5">
                    <img
                        src={film.poster}
                        alt={film.title}
                        className="w-full rounded-xl mb-3 shadow object-cover"
                        style={{ maxHeight: '280px' }}
                    />
                    <p className="font-bold text-gray-800 text-center mb-4">{film.title}</p>
                    <button
                        onClick={onContinue}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl transition-colors"
                    >
                        Продолжить свайпать
                    </button>
                </div>
            </div>
        </div>
    );
}
