import React from 'react';

export default function MatchView({ film }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-green-100 text-center p-6">
            <h1 className="text-3xl font-bold text-green-800 mb-4">🎉 Совпадение найдено!</h1>
            <h2 className="text-xl text-gray-800 mb-4">Вы оба выбрали:</h2>

            <img
                src={film.poster}
                alt={film.title}
                className="mb-4 rounded-lg shadow-lg max-w-xs"
            />

            <div className="text-2xl font-semibold text-black">{film.title}</div>
        </div>
    );
}

