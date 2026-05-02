import { useState } from 'react';

export default function RoomJoin({ onJoin }) {
    const [userId, setUserId] = useState('');
    const [roomId, setRoomId] = useState('');

    const canJoin = userId.trim() && roomId.trim();
    const submit = () => canJoin && onJoin(userId.trim(), roomId.trim());

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
            <div className="w-full max-w-sm animate-slide-up">
                <div className="text-center mb-10">
                    <div className="text-6xl mb-5">🎬</div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Film Matcher</h1>
                    <p className="text-zinc-500 mt-2 text-sm">Найдите фильм вместе</p>
                </div>

                <div className="space-y-3">
                    <input
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white placeholder-zinc-600 text-sm outline-none focus:border-zinc-600 transition-colors"
                        placeholder="Ваше имя"
                        value={userId}
                        autoComplete="off"
                        onChange={e => setUserId(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && submit()}
                    />
                    <input
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white placeholder-zinc-600 text-sm outline-none focus:border-zinc-600 transition-colors"
                        placeholder="Код комнаты"
                        value={roomId}
                        autoComplete="off"
                        onChange={e => setRoomId(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && submit()}
                    />
                    <button
                        disabled={!canJoin}
                        onClick={submit}
                        className="w-full bg-white text-zinc-950 font-bold py-4 rounded-2xl transition-all hover:bg-zinc-100 active:scale-[0.97] disabled:opacity-20 disabled:cursor-not-allowed mt-1 text-sm"
                    >
                        Войти в комнату
                    </button>
                </div>
            </div>
        </div>
    );
}
