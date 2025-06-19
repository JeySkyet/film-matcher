import React, { useState } from 'react';

export default function RoomJoin({ onJoin }) {
    const [userId, setUserId] = useState('');
    const [roomId, setRoomId] = useState('');

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-300">
            <h1 className="text-2xl font-bold mb-6">🎬 Film Matcher</h1>
            <input
                className="mb-4 p-2 border border-gray-300 rounded w-64"
                placeholder="User ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
            />
            <input
                className="mb-4 p-2 border border-gray-300 rounded w-64"
                placeholder="Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
            />
            <button
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                onClick={() => onJoin(userId, roomId)}
            >
                Join Room
            </button>
        </div>
    );
}
