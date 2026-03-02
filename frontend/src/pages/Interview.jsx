import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RetellWebClient } from 'retell-client-js-sdk';
import { interviewApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PhoneOff, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';

const TOPIC_LABELS = {
    meta_ads: 'Meta Ads',
    google_ads: 'Google Ads',
    seo: 'SEO',
    digital_marketing: 'Digital Marketing',
    hr: 'HR Interview',
};

/* ─── Singleton Retell client (created once, never re-created) ─────────── */
const retellClient = new RetellWebClient();

/* ─── Done Screen — polls every 5s for Retell post-call score ──────────── */
const DoneScreen = ({ topic, topicLabel, user, navigate }) => {
    const [liveScore, setLiveScore] = useState(null);  // number | null
    const [liveFeedback, setLiveFeedback] = useState('');
    const [polling, setPolling] = useState(true);
    const [countdown, setCountdown] = useState(5);     // 5s initial wait
    const [dots, setDots] = useState('');
    const pollRef = useRef(null);
    const countdownRef = useRef(null);
    const attemptsRef = useRef(0);
    const MAX_ATTEMPTS = 24; // 24 × 5s = 2 minutes max

    // Animated dots
    useEffect(() => {
        const id = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
        return () => clearInterval(id);
    }, []);

    // 5-second countdown THEN start polling every 5s
    useEffect(() => {
        // Countdown tick
        countdownRef.current = setInterval(() => {
            setCountdown(c => {
                if (c <= 1) {
                    clearInterval(countdownRef.current);
                    startPolling();
                    return 0;
                }
                return c - 1;
            });
        }, 1000);
        return () => {
            clearInterval(countdownRef.current);
            clearInterval(pollRef.current);
        };
    }, [topic]);

    const startPolling = () => {
        pollRef.current = setInterval(async () => {
            attemptsRef.current += 1;
            try {
                const { data } = await interviewApi.getStatus();
                const topicData = data.find(t => t.topic === topic);
                const sc = topicData?.score || '';
                // Look for a real numeric score like "7.5/10" (skip "Pending")
                const match = sc.match(/^(\d+\.?\d*)/);
                if (match && !sc.toLowerCase().startsWith('pend')) {
                    const num = parseFloat(match[1]);
                    setLiveScore(num);
                    setLiveFeedback(topicData?.feedback || '');
                    setPolling(false);
                    clearInterval(pollRef.current);
                }
            } catch (_) { }
            if (attemptsRef.current >= MAX_ATTEMPTS) {
                setPolling(false);
                clearInterval(pollRef.current);
            }
        }, 5000); // poll every 5 seconds
    };

    const scoreColor = liveScore === null
        ? '#9ca3af'
        : liveScore >= 8 ? '#16a34a'
            : liveScore >= 6 ? '#d97706' : '#dc2626';
    const scoreBg = liveScore === null
        ? '#f3f4f6'
        : liveScore >= 8 ? '#dcfce7'
            : liveScore >= 6 ? '#fef9c3' : '#fee2e2';

    return (
        <div style={{
            minHeight: '100vh', background: 'linear-gradient(145deg, #f0f5f4, #e6eeec)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem',
        }}>
            <div className="interview-done-card" style={{
                background: 'white', borderRadius: '24px', padding: '2.5rem',
                maxWidth: '500px', width: '100%', textAlign: 'center',
                boxShadow: '0 8px 40px rgba(14,61,53,0.1)', animation: 'fadeUp 0.4s ease',
            }}>
                <CheckCircle size={52} color="var(--success)" style={{ marginBottom: '1rem' }} />
                <h2 style={{ marginBottom: '0.4rem', fontSize: '1.5rem' }}>Interview Complete!</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                    Well done, <strong>{user?.name?.split(' ')[0]}</strong>! Pooja is evaluating your <strong>{topicLabel}</strong> interview.
                </p>

                {/* Score box */}
                <div style={{
                    background: scoreBg, borderRadius: '16px', padding: '1.8rem',
                    marginBottom: '1.5rem', border: `2px solid ${scoreColor}30`,
                    transition: 'all 0.5s ease',
                }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: '800', letterSpacing: '1.2px', textTransform: 'uppercase', color: scoreColor, marginBottom: '0.6rem' }}>
                        YOUR SCORE
                    </p>

                    {polling && liveScore === null ? (
                        /* Analyzing animation */
                        <div style={{ padding: '0.5rem 0' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '0.8rem' }}>
                                {[0, 1, 2].map(i => (
                                    <div key={i} style={{
                                        width: '10px', height: '10px', borderRadius: '50%',
                                        background: 'var(--primary)',
                                        animation: `scoreDot 1.2s ease-in-out ${i * 0.2}s infinite alternate`,
                                    }} />
                                ))}
                            </div>
                            <p style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--primary)', marginBottom: '0.3rem' }}>
                                {countdown > 0 ? `Starting analysis in ${countdown}s` : `Checking results${dots}`}
                            </p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                Pooja is reviewing your answers. This takes about 15–30 seconds.
                            </p>
                        </div>
                    ) : liveScore !== null ? (
                        /* Real score arrived */
                        <div style={{ animation: 'fadeUp 0.4s ease' }}>
                            <p style={{ fontSize: '3.5rem', fontWeight: '900', color: scoreColor, lineHeight: 1, marginBottom: '0.3rem' }}>
                                {liveScore}<span style={{ fontSize: '1.3rem', fontWeight: '600' }}>/10</span>
                            </p>
                            <p style={{ fontSize: '0.9rem', fontWeight: '700', color: scoreColor }}>
                                {liveScore >= 8 ? '🌟 Excellent performance!' : liveScore >= 6 ? '👍 Good job!' : '📚 Keep practicing!'}
                            </p>
                        </div>
                    ) : (
                        /* Timed out */
                        <div>
                            <p style={{ fontSize: '1.8rem', fontWeight: '800', color: '#9ca3af', marginBottom: '0.2rem' }}>⏳</p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Score will appear on your dashboard once Pooja finishes analysis.</p>
                        </div>
                    )}
                </div>

                {/* Feedback box — shows once score arrives */}
                {liveFeedback && (
                    <div style={{
                        background: '#f8faf9', borderRadius: '12px', padding: '1rem 1.2rem',
                        marginBottom: '1.5rem', textAlign: 'left',
                        border: '1px solid rgba(14,61,53,0.08)',
                        animation: 'fadeUp 0.5s ease',
                    }}>
                        <p style={{ fontSize: '0.72rem', fontWeight: '800', letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                            Pooja's Feedback
                        </p>
                        <p style={{ fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.7, margin: 0 }}>{liveFeedback}</p>
                    </div>
                )}

                <button
                    className="btn-primary"
                    style={{ width: '100%', padding: '0.95rem', fontSize: '0.95rem' }}
                    onClick={() => navigate('/dashboard')}
                >
                    {liveScore !== null ? 'Back to Dashboard →' : 'Go to Dashboard'}
                </button>

                {polling && liveScore === null && (
                    <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.8rem' }}>
                        You can also go to dashboard and check back later
                    </p>
                )}
            </div>
            <style>{`
                @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
                @keyframes scoreDot { 0%{transform:translateY(0);opacity:0.4} 100%{transform:translateY(-6px);opacity:1} }
            `}</style>
        </div>
    );
};


/* ─── Animated Orb ──────────────────────────────────────────────────────── */
const Orb = ({ state }) => {
    // state: 'idle' | 'connecting' | 'speaking' | 'listening'
    const speaking = state === 'speaking';
    const listening = state === 'listening';
    const connecting = state === 'connecting';

    const orbColor = speaking
        ? 'radial-gradient(circle at 35% 35%, #4ade80, #16a34a 55%, #0e3d35)'
        : listening
            ? 'radial-gradient(circle at 35% 35%, #93c5fd, #3b82f6 55%, #1d4ed8)'
            : connecting
                ? 'radial-gradient(circle at 35% 35%, #86efac, #22c55e 55%, #15803d)'
                : 'radial-gradient(circle at 35% 35%, #6ee7b7, #059669 55%, #064e3b)';

    const glowColor = speaking
        ? 'rgba(34,197,94,0.5)'
        : listening
            ? 'rgba(59,130,246,0.45)'
            : 'rgba(14,61,53,0.35)';

    const ringColor = speaking
        ? 'rgba(34,197,94,ALPHA)'
        : listening
            ? 'rgba(59,130,246,ALPHA)'
            : 'rgba(14,61,53,ALPHA)';

    return (
        <div style={{ position: 'relative', width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

            {/* Ripple rings — 3 concentric, staggered */}
            {(speaking || listening) && [0, 1, 2].map(i => (
                <div key={i} style={{
                    position: 'absolute',
                    width: '200px', height: '200px',
                    borderRadius: '50%',
                    border: `2px solid ${ringColor.replace('ALPHA', speaking ? (0.5 - i * 0.15).toString() : (0.35 - i * 0.1).toString())}`,
                    animation: `orbRing ${speaking ? 1.2 : 2}s ease-out ${i * (speaking ? 0.35 : 0.6)}s infinite`,
                }} />
            ))}

            {/* Glow behind orb */}
            <div style={{
                position: 'absolute',
                width: '140px', height: '140px',
                borderRadius: '50%',
                background: glowColor,
                filter: 'blur(28px)',
                animation: (speaking || listening) ? `orbGlow ${speaking ? 1 : 2.4}s ease-in-out infinite alternate` : 'none',
                transition: 'background 0.8s ease',
            }} />

            {/* Main orb sphere */}
            <div style={{
                width: '120px', height: '120px',
                borderRadius: '50%',
                background: orbColor,
                boxShadow: `0 8px 32px ${glowColor}, inset 0 -8px 20px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.15)`,
                animation: connecting
                    ? 'orbSpin 1.8s linear infinite'
                    : speaking
                        ? 'orbPulse 0.9s ease-in-out infinite alternate'
                        : listening
                            ? 'orbBreath 2.5s ease-in-out infinite alternate'
                            : 'orbFloat 4s ease-in-out infinite',
                transition: 'background 0.8s ease, box-shadow 0.8s ease',
                position: 'relative', zIndex: 1,
            }}>
                {/* Specular highlight */}
                <div style={{
                    position: 'absolute', top: '18%', left: '22%',
                    width: '30%', height: '20%',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.35)',
                    filter: 'blur(3px)',
                }} />
            </div>

            <style>{`
                @keyframes orbRing    { 0%{transform:scale(1);opacity:1} 100%{transform:scale(2.2);opacity:0} }
                @keyframes orbGlow    { 0%{transform:scale(0.9);opacity:0.6} 100%{transform:scale(1.2);opacity:1} }
                @keyframes orbPulse   { 0%{transform:scale(1)} 100%{transform:scale(1.07)} }
                @keyframes orbBreath  { 0%{transform:scale(0.96)} 100%{transform:scale(1.04)} }
                @keyframes orbFloat   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
                @keyframes orbSpin    { from{filter:hue-rotate(0deg)} to{filter:hue-rotate(360deg)} }
            `}</style>
        </div>
    );
};

/* ─── Interview Page ─────────────────────────────────────────────────────── */
const Interview = () => {
    const { topic } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const topicLabel = TOPIC_LABELS[topic] || topic;

    // 'pre' | 'session' | 'scoring' | 'done'
    const [screen, setScreen] = useState('pre');
    const [error, setError] = useState('');
    const [isAgentTalking, setIsAgentTalking] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [scoreResult, setScoreResult] = useState(null); // { overallScore, globalFeedback }
    const callIdRef = useRef(null);
    const liveTranscriptRef = useRef([]); // accumulates real transcript from Retell update events

    // ── Wire up Retell client events once ──────────────────────────────────
    useEffect(() => {
        retellClient.on('call_started', () => {
            setIsConnecting(false);
            setIsConnected(true);
            setError('');
            liveTranscriptRef.current = [];
        });

        // 'update' events carry the cumulative transcript from Retell
        retellClient.on('update', (evt) => {
            if (evt && Array.isArray(evt.transcript) && evt.transcript.length > 0) {
                // Retell format: { role: 'agent'|'user', content: '...' }
                // Our /complete expects: { role: 'agent'|'user', text: '...' }
                liveTranscriptRef.current = evt.transcript.map(m => ({
                    role: m.role,
                    text: m.content || m.text || '',
                }));
            }
        });

        retellClient.on('call_ended', async () => {
            setIsConnected(false);
            setIsAgentTalking(false);
            setScreen('scoring');
            try {
                const transcript = liveTranscriptRef.current.length >= 2
                    ? liveTranscriptRef.current
                    : [
                        { role: 'agent', text: `Retell call ended. call_id: ${callIdRef.current}` },
                        { role: 'user', text: `Topic: ${topic}` },
                    ];
                const { data } = await interviewApi.complete(topic, transcript);
                setScoreResult(data); // store score to show on Done screen
            } catch (_) { /* best-effort — score saved async */ }
            setScreen('done');
        });

        retellClient.on('agent_start_talking', () => setIsAgentTalking(true));
        retellClient.on('agent_stop_talking', () => setIsAgentTalking(false));

        retellClient.on('error', (err) => {
            console.error('Retell error:', err);
            setError(typeof err === 'string' ? err : 'Connection error. Please try again.');
            setIsConnecting(false);
            setIsConnected(false);
        });

        // Cleanup on unmount
        return () => {
            retellClient.stopCall();
            retellClient.removeAllListeners();
        };
    }, [topic]);

    // Derived orb state
    const orbState = isConnecting ? 'connecting'
        : isConnected && isAgentTalking ? 'speaking'
            : isConnected && !isAgentTalking ? 'listening'
                : 'idle';

    // ── Start session ──────────────────────────────────────────────────────
    const startSession = useCallback(async () => {
        setError('');
        setIsConnecting(true);
        try {
            // 1. Check HTTPS / mediaDevices availability (HTTP on mobile = undefined)
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error(
                    'Microphone access requires a secure connection (HTTPS). ' +
                    'Please ask your administrator to open the secure link.'
                );
            }

            // 2. Request mic permission first & immediately release lock so Retell can grab it
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, echoCancellation: true });
            stream.getTracks().forEach(track => track.stop());

            // 3. Ask our backend for a Retell access token
            const { data } = await interviewApi.createWebCall(topic);
            callIdRef.current = data.call_id;

            // 4. Hand the access token to the Retell SDK
            setScreen('session');
            await retellClient.startCall({ accessToken: data.access_token });
        } catch (err) {
            setScreen('pre');
            setIsConnecting(false);
            if (err.name === 'NotAllowedError') {
                setError('Microphone access denied. Please allow microphone in your browser settings and try again.');
            } else if (err.name === 'NotFoundError') {
                setError('No microphone found. Please connect a microphone and try again.');
            } else {
                setError(err.response?.data?.message || err.message || 'Failed to start interview. Please try again.');
            }
        }
    }, [topic]);

    // ── End session ────────────────────────────────────────────────────────
    const endSession = useCallback(() => {
        retellClient.stopCall();
        // call_ended event will fire & handle scoring
    }, []);

    // ── PRE-START ──────────────────────────────────────────────────────────
    if (screen === 'pre') return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(145deg, #f0f5f4 0%, #e6eeec 100%)',
            display: 'flex', flexDirection: 'column',
        }}>
            {/* Header */}
            <header style={{
                background: 'white', borderBottom: '1px solid rgba(14,61,53,0.08)',
                padding: '0 2rem', height: '64px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                boxShadow: '0 2px 12px rgba(14,61,53,0.06)',
            }}>
                <BrandLogo size="sm" />
                <button
                    onClick={() => navigate('/dashboard')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        background: 'none', border: '1.5px solid var(--glass-border)',
                        color: 'var(--text-muted)', padding: '7px 14px', borderRadius: '8px',
                        cursor: 'pointer', fontSize: '0.84rem', fontWeight: '500',
                    }}
                >
                    <ArrowLeft size={14} /> Dashboard
                </button>
            </header>

            {/* Content */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                <div className="interview-pre-card" style={{
                    background: 'white', borderRadius: '24px', padding: '3rem',
                    maxWidth: '460px', width: '100%', textAlign: 'center',
                    boxShadow: '0 8px 40px rgba(14,61,53,0.1)',
                    animation: 'fadeUp 0.4s ease',
                }}>
                    {/* Topic badge */}
                    <span style={{
                        display: 'inline-block',
                        background: 'rgba(14,61,53,0.08)', color: 'var(--primary)',
                        borderRadius: '100px', padding: '4px 16px', fontSize: '0.78rem',
                        fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase',
                        marginBottom: '2rem',
                    }}>
                        {topicLabel}
                    </span>

                    {/* Orb preview */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                        <Orb state="idle" />
                    </div>

                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>Meet Pooja</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '2rem', lineHeight: 1.6 }}>
                        Your AI interviewer from RUSHIPANDIT. Pooja will ask you questions about{' '}
                        <strong>{topicLabel}</strong> and evaluate your responses in real-time.
                    </p>

                    {/* What to expect */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                        {[['🎙️', 'Voice'], ['🧠', 'AI Scored'], ['📊', 'Auto-saved']].map(([icon, label]) => (
                            <div key={label} style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.4rem', marginBottom: '4px' }}>{icon}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>{label}</div>
                            </div>
                        ))}
                    </div>

                    {error && (
                        <div style={{
                            background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)',
                            borderRadius: '8px', padding: '10px 14px', marginBottom: '1.2rem',
                            color: 'var(--danger)', fontSize: '0.84rem', textAlign: 'left',
                        }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <button
                        className="btn-primary"
                        onClick={startSession}
                        disabled={isConnecting}
                        style={{ width: '100%', padding: '1rem', fontSize: '1rem', borderRadius: '12px' }}
                    >
                        {isConnecting ? 'Connecting...' : 'Begin Interview with Pooja'}
                    </button>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.76rem', marginTop: '0.8rem' }}>
                        Microphone access required
                    </p>
                </div>
            </div>
            <style>{`@keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }`}</style>
        </div>
    );

    // ── SCORING ────────────────────────────────────────────────────────────
    if (screen === 'scoring') return (
        <div style={{
            minHeight: '100vh', background: '#0a1a14',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem',
        }}>
            <Loader2 size={44} color="#4ade80" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem' }}>Saving your interview...</p>
            <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </div>
    );

    // ── DONE — poll for score from Retell webhook ──────────────────────────
    if (screen === 'done') {
        return <DoneScreen topic={topic} topicLabel={topicLabel} user={user} navigate={navigate} />;
    }

    // ── LIVE SESSION ───────────────────────────────────────────────────────
    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(160deg, #071510 0%, #0a1f18 50%, #071510 100%)',
            display: 'flex', flexDirection: 'column',
            fontFamily: "'Inter', system-ui, sans-serif",
        }}>
            {/* Top bar */}
            <header style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '1.2rem 2rem',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
                {/* Logo — white version on dark bg */}
                <img
                    src="/logo-full.png"
                    alt="RUSHIPANDIT"
                    style={{ width: '140px', height: 'auto', filter: 'brightness(0) invert(1) opacity(0.9)' }}
                />

                <div style={{
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '100px', padding: '5px 14px',
                    color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem',
                }}>
                    {topicLabel} Interview
                </div>
            </header>

            {/* Center stage */}
            <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '2.5rem',
                padding: '2rem',
            }}>
                {/* Orb */}
                <Orb state={orbState} />

                {/* Agent name + status */}
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ color: 'white', fontSize: '1.6rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                        Pooja
                    </h2>
                    <p style={{
                        color: orbState === 'speaking' ? '#4ade80' : orbState === 'listening' ? '#93c5fd' : 'rgba(255,255,255,0.45)',
                        fontSize: '0.92rem', fontWeight: '500', transition: 'color 0.5s ease',
                        minHeight: '22px',
                    }}>
                        {isConnecting ? 'Connecting...'
                            : orbState === 'speaking' ? 'Pooja is speaking...'
                                : orbState === 'listening' ? 'Listening to you...'
                                    : ''}
                    </p>
                </div>
            </div>

            {/* Bottom — End button */}
            <div style={{
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                padding: '2.5rem',
                borderTop: '1px solid rgba(255,255,255,0.05)',
            }}>
                <button
                    onClick={endSession}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        background: 'rgba(220,38,38,0.9)', color: 'white', border: 'none',
                        padding: '1rem 2.2rem', borderRadius: '100px',
                        fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer',
                        boxShadow: '0 4px 24px rgba(220,38,38,0.4)',
                        transition: 'all 0.25s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(220,38,38,0.55)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(220,38,38,0.4)'; }}
                >
                    <PhoneOff size={18} />
                    End Interview
                </button>
            </div>
        </div>
    );
};

export default Interview;
