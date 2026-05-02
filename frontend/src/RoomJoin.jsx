import { useState } from 'react';

export default function RoomJoin({ onJoin }) {
    const [userId, setUserId] = useState('');
    const [roomId, setRoomId] = useState('');

    const canJoin = userId.trim() && roomId.trim();
    const submit = () => canJoin && onJoin(userId.trim(), roomId.trim());

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
            <div className="w-full animate-slide-up" style={{ maxWidth: '320px' }}>
                {/* Logo */}
                <div className="text-center mb-10">
                    <div className="text-5xl mb-4">🎬</div>
                    <h1 className="text-2xl font-black text-white tracking-tight">Film Matcher</h1>
                    <p className="text-zinc-500 mt-1.5 text-sm">Найдите фильм вместе</p>
                </div>

                {/* Form */}
                <div className="space-y-3">
                    <div>
                        <label className="block text-zinc-500 text-xs font-medium mb-1.5 ml-1">Ваше имя</label>
                        <input
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-700 outline-none focus:border-zinc-600 transition-colors"
                            placeholder="Например: Женя"
                            value={userId}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck="false"
                            onChange={e => setUserId(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && submit()}
                        />
                    </div>
                    <div>
                        <label className="block text-zinc-500 text-xs font-medium mb-1.5 ml-1">Код комнаты</label>
                        <input
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-700 outline-none focus:border-zinc-600 transition-colors"
                            placeholder="Например: 1234"
                            value={roomId}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck="false"
                            onChange={e => setRoomId(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && submit()}
                        />
                    </div>

                    <button
                        disabled={!canJoin}
                        onClick={submit}
                        className="w-full bg-white text-zinc-950 font-bold py-3.5 rounded-xl transition-all hover:bg-zinc-100 active:scale-[0.97] disabled:opacity-20 disabled:cursor-not-allowed mt-1"
                    >
                        Войти
                    </button>
                </div>
            </div>
        </div>
    );
}
