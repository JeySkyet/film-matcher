export default function MatchOverlay({ film, onContinue }) {
    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in p-4">
            <div className="bg-zinc-900 rounded-3xl w-full max-w-sm overflow-hidden animate-pop-in border border-zinc-800">
                {/* Header */}
                <div className="px-6 pt-7 pb-5 text-center">
                    <div className="text-4xl mb-3">🎉</div>
                    <h2 className="text-white text-xl font-black tracking-tight">Совпадение!</h2>
                    <p className="text-zinc-500 text-sm mt-1">Вы оба хотите посмотреть</p>
                </div>

                {/* Film */}
                <div className="px-6">
                    <div className="rounded-2xl overflow-hidden bg-zinc-800" style={{ aspectRatio: '16/9' }}>
                        <img
                            src={film.poster}
                            alt={film.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                        />
                    </div>
                    <p className="text-white font-bold text-center mt-4 text-base">{film.title}</p>
                </div>

                {/* Button */}
                <div className="p-6">
                    <button
                        onClick={onContinue}
                        className="w-full bg-white text-zinc-950 font-bold py-4 rounded-2xl transition-all hover:bg-zinc-100 active:scale-[0.97] text-sm"
                    >
                        Продолжить свайпать
                    </button>
                </div>
            </div>
        </div>
    );
}
