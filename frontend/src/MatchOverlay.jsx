export default function MatchOverlay({ film, onContinue }) {
    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            padding: '24px',
            fontFamily: "'Inter', -apple-system, sans-serif",
        }}>
            <div style={{
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '24px',
                width: '100%',
                maxWidth: '300px',
                overflow: 'hidden',
                animation: 'pop-in 0.28s cubic-bezier(0.34,1.56,0.64,1)',
            }}>
                {/* Header */}
                <div style={{ padding: '24px 24px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '40px', marginBottom: '10px' }}>🎉</div>
                    <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: '900', margin: '0 0 4px', letterSpacing: '-0.3px' }}>
                        Совпадение!
                    </h2>
                    <p style={{ color: '#52525b', fontSize: '13px', margin: 0 }}>
                        Вы оба хотите посмотреть
                    </p>
                </div>

                {/* Poster */}
                <div style={{ padding: '0 24px' }}>
                    {film.poster ? (
                        <img
                            src={film.poster}
                            alt={film.title}
                            style={{ width: '100%', borderRadius: '16px', display: 'block' }}
                        />
                    ) : (
                        <div style={{ width: '100%', aspectRatio: '2/3', background: '#27272a', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>
                            🎬
                        </div>
                    )}
                    <p style={{
                        color: '#fff',
                        fontWeight: '700',
                        textAlign: 'center',
                        margin: '14px 0 0',
                        fontSize: '15px',
                        lineHeight: '1.3',
                    }}>
                        {film.title}
                    </p>
                </div>

                {/* Button */}
                <div style={{ padding: '16px 24px 24px' }}>
                    <button
                        onClick={onContinue}
                        style={{
                            width: '100%',
                            background: '#ffffff',
                            color: '#09090b',
                            fontWeight: '700',
                            fontSize: '15px',
                            padding: '14px',
                            borderRadius: '12px',
                            border: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        Продолжить свайпать
                    </button>
                </div>
            </div>
        </div>
    );
}
