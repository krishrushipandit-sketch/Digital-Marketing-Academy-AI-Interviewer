import React, { useState } from 'react';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';

const Login = () => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const resp = isAdmin
                ? await authApi.adminLogin(email, password)
                : await authApi.login(email, password);
            login(resp.data.user, resp.data.token);
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            fontFamily: "'Inter', system-ui, sans-serif",
        }}>
            {/* ── Left panel ── */}
            <div className="login-panel-left" style={{
                flex: '0 0 42%',
                background: 'linear-gradient(160deg, #0a2e26 0%, #0e3d35 40%, #1a5c4a 100%)',
                display: 'flex', flexDirection: 'column',
                justifyContent: 'flex-start',
                padding: '2.5rem 3rem 2.5rem',
                position: 'relative', overflow: 'hidden',
            }}>
                {/* Decorative circles */}
                <div style={{
                    position: 'absolute', width: '400px', height: '400px', borderRadius: '50%',
                    border: '1px solid rgba(255,255,255,0.06)',
                    top: '-120px', right: '-120px',
                }} />
                <div style={{
                    position: 'absolute', width: '280px', height: '280px', borderRadius: '50%',
                    border: '1px solid rgba(255,255,255,0.06)',
                    bottom: '60px', left: '-80px',
                }} />

                {/* Logo */}
                <div style={{ marginBottom: '1.4rem' }}>
                    <img
                        src="/logo-full.png"
                        alt="RUSHIPANDIT Institute of Business & AI"
                        style={{
                            width: '100%',
                            maxWidth: '220px',
                            height: 'auto',
                            display: 'block',
                            filter: 'brightness(0) invert(1) opacity(0.95)',
                        }}
                    />
                    <div style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.65)', paddingLeft: '45px', marginTop: '-12px' }}>
                        powered by <strong style={{ color: 'rgba(255,255,255,0.95)' }}>Agnomatic AI</strong>
                    </div>
                </div>

                {/* Central content */}
                <div>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '100px', padding: '6px 14px', marginBottom: '1.8rem',
                    }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', animation: 'blink 2s infinite' }} />
                        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.78rem', fontWeight: '600' }}>
                            AI Interview Platform
                        </span>
                    </div>

                    <h1 style={{
                        color: 'white', fontSize: '2rem', fontWeight: '800',
                        lineHeight: 1.25, marginBottom: '1rem',
                    }}>
                        Ace your interviews
                    </h1>

                    <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem', lineHeight: 1.7, maxWidth: '300px' }}>
                        Practice voice interviews with our AI agent, get instant feedback,
                        and track your progress — all in one place.
                    </p>

                    {/* Feature dots */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', marginTop: '2rem' }}>
                        {[
                            'Real-time voice conversations with AI',
                            'AI-evaluated scores & feedback',
                            'Topics: Google Ads, SEO, Meta Ads & more',
                        ].map(f => (
                            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', flexShrink: 0 }} />
                                <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.84rem' }}>{f}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', marginTop: 'auto' }}>
                    © {new Date().getFullYear()} RUSHIPANDIT Institute of Business &amp; AI
                </p>

                <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
            </div>

            {/* ── Right panel — form ── */}
            <div className="login-panel-right" style={{
                flex: 1,
                background: '#f8faf9',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '3rem 2rem',
            }}>

                {/* ── Mobile-only: compact green brand header ── */}
                <div className="login-mobile-brand" style={{ display: 'none' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #071a14 0%, #0e3d35 60%, #1a5c4a 100%)',
                        padding: '1.4rem 1.8rem 1.6rem',
                        position: 'relative', overflow: 'hidden',
                    }}>
                        {/* Subtle decorative rings */}
                        <div style={{ position: 'absolute', width: 220, height: 220, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)', top: -90, right: -70, pointerEvents: 'none' }} />
                        <div style={{ position: 'absolute', width: 140, height: 140, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.04)', bottom: -50, left: -40, pointerEvents: 'none' }} />

                        {/* Logo + live badge in one row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <img
                                src="/logo-full.png"
                                alt="RUSHIPANDIT"
                                style={{ width: 120, height: 'auto', filter: 'brightness(0) invert(1) opacity(0.95)' }}
                            />
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                                borderRadius: 100, padding: '4px 10px',
                            }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', animation: 'blink 2s infinite' }} />
                                <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.68rem', fontWeight: 600 }}>Live</span>
                            </div>
                        </div>

                        {/* Tagline + powered by */}
                        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.75rem', margin: '0 0 0.3rem', lineHeight: 1.4 }}>
                            Voice interviews · AI scoring · Instant feedback
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.65rem', margin: 0 }}>
                            powered by <strong style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Agnomatic AI</strong>
                        </p>
                    </div>
                </div>


                {/* ── Form card ── */}
                <div className="login-form-inner" style={{ width: '100%', maxWidth: '380px' }}>

                    <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f1f1c', marginBottom: '0.4rem' }}>
                        Welcome back
                    </h2>
                    <p style={{ color: '#6b8c86', fontSize: '0.9rem', marginBottom: '2rem' }}>
                        Sign in to access your dashboard
                    </p>

                    {/* Role toggle */}
                    <div style={{
                        display: 'flex', background: '#edf2f0',
                        borderRadius: '12px', padding: '5px', marginBottom: '2rem',
                        border: '1px solid #dde8e4',
                    }}>
                        {['Student', 'Admin'].map(role => {
                            const active = (role === 'Admin') === isAdmin;
                            return (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => setIsAdmin(role === 'Admin')}
                                    style={{
                                        flex: 1, padding: '10px', border: 'none', borderRadius: '9px',
                                        cursor: 'pointer', fontWeight: '600', fontSize: '0.88rem',
                                        fontFamily: "'Inter', sans-serif",
                                        transition: 'all 0.2s ease',
                                        background: active ? '#0e3d35' : 'transparent',
                                        color: active ? 'white' : '#6b8c86',
                                        boxShadow: active ? '0 2px 10px rgba(14,61,53,0.3)' : 'none',
                                    }}
                                >
                                    {role}
                                </button>
                            );
                        })}
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Email field */}
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#3d5e58', marginBottom: '6px' }}>
                            Email address
                        </label>
                        <div style={{ position: 'relative', marginBottom: '1.2rem' }}>
                            <Mail size={15} style={{ position: 'absolute', top: '50%', left: '14px', transform: 'translateY(-50%)', color: '#9cb8b2' }} />
                            <input
                                type="email"
                                placeholder="you@example.com"
                                style={{ paddingLeft: '40px', marginBottom: 0, borderRadius: '10px', border: '1.5px solid #dde8e4', background: 'white' }}
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        {/* Password field */}
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#3d5e58', marginBottom: '6px' }}>
                            Password
                        </label>
                        <div style={{ position: 'relative', marginBottom: '1.8rem' }}>
                            <Lock size={15} style={{ position: 'absolute', top: '50%', left: '14px', transform: 'translateY(-50%)', color: '#9cb8b2' }} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                style={{ paddingLeft: '40px', paddingRight: '42px', marginBottom: 0, borderRadius: '10px', border: '1.5px solid #dde8e4', background: 'white' }}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute', top: '50%', right: '12px',
                                    transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', cursor: 'pointer', color: '#9cb8b2', padding: '4px',
                                }}
                            >
                                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>

                        {/* Error */}
                        {error && (
                            <div style={{
                                display: 'flex', alignItems: 'flex-start', gap: '8px',
                                background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.18)',
                                borderRadius: '8px', padding: '10px 14px', marginBottom: '1.2rem',
                            }}>
                                <AlertCircle size={15} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
                                <span style={{ color: '#dc2626', fontSize: '0.84rem', lineHeight: 1.4 }}>{error}</span>
                            </div>
                        )}

                        <button
                            className="btn-primary"
                            style={{ width: '100%', padding: '0.9rem', borderRadius: '10px', fontSize: '0.95rem' }}
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : `Sign in as ${isAdmin ? 'Admin' : 'Student'}`}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
