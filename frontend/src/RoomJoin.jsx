import { useState } from 'react';

export default function RoomJoin({ onJoin }) {
    const [userId, setUserId] = useState('');
    const [roomId, setRoomId] = useState('');

    const canJoin = userId.trim() && roomId.trim();
    const submit = () => canJoin && onJoin(userId.trim(), roomId.trim());

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-xs p-8">
                <div className="text-center mb-8">
                    <span className="text-5xl">🎬</span>
                    <h1 className="text-2xl font-bold text-gray-800 mt-3">Film Matcher</h1>
                    <p className="text-sm text-gray-400 mt-1">Найдите фильм вместе</p>
                </div>

                <div className="flex flex-col gap-3">
                    <input
                        className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 transition-colors"
                        placeholder="Ваше имя"
                        value={userId}
                        onChange={e => setUserId(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && submit()}
                    />
                    <input
                        className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 transition-colors"
                        placeholder="Код комнаты"
                        value={roomId}
                        onChange={e => setRoomId(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && submit()}
                    />
                    <button
                        disabled={!canJoin}
                        onClick={submit}
                        className="bg-blue-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors hover:bg-blue-600 mt-2"
                    >
                        Войти в комнату
                    </button>
                </div>
            </div>
        </div>
    );
}
