import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { interviewApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Lock, Play, LogOut, ChevronRight, BookOpen, Search, Megaphone, Users, Globe, CheckCircle, Trophy } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';

const TOPIC_META = {
    meta_ads: { label: 'Meta Ads', icon: Megaphone, color: '#1877f2', bg: '#eef4ff', accent: '#dbeafe' },
    google_ads: { label: 'Google Ads', icon: Search, color: '#ea4335', bg: '#fff0ef', accent: '#fee2e2' },
    seo: { label: 'SEO', icon: Globe, color: '#0e3d35', bg: '#eef5f3', accent: '#d1fae5' },
    digital_marketing: { label: 'Digital Marketing', icon: BookOpen, color: '#7c3aed', bg: '#f3f0ff', accent: '#ede9fe' },
    hr: { label: 'HR Interview', icon: Users, color: '#d97706', bg: '#fffbeb', accent: '#fef3c7' },
};

/* ── helpers ────────────────────────────────────── */
function parseScore(scoreStr) {
    if (!scoreStr) return null;
    const m = scoreStr.match(/^(\d+\.?\d*)/);
    return m ? parseFloat(m[1]) : null;
}
function scoreColor(s) {
    if (s === null) return '#9ca3af';
    if (s >= 8) return '#16a34a';
    if (s >= 6) return '#d97706';
    return '#dc2626';
}
function scoreBg(s) {
    if (s === null) return '#f3f4f6';
    if (s >= 8) return '#dcfce7';
    if (s >= 6) return '#fef9c3';
    return '#fee2e2';
}
function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
}

const Dashboard = () => {
    const [status, setStatus] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => { fetchStatus(); }, []);

    const fetchStatus = async () => {
        try {
            const { data } = await interviewApi.getStatus();
            setStatus(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const completed = status.filter(s => s.completed);
    const available = status.filter(s => s.unlocked && !s.completed);
    const locked = status.filter(s => !s.unlocked && !s.completed);
    const totalDone = completed.length;

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(145deg, #f0f5f4 0%, #e6eeec 100%)' }}>

            {/* ── Top nav ── */}
            <header className="topnav-mobile" style={{
                background: 'white',
                borderBottom: '1px solid rgba(14,61,53,0.08)',
                padding: '0 2rem',
                height: '64px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                boxShadow: '0 2px 12px rgba(14,61,53,0.06)',
                position: 'sticky', top: 0, zIndex: 10,
            }}>
                <BrandLogo size="sm" />
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className="topnav-user-text" style={{ textAlign: 'right' }}>
                        <p style={{ fontWeight: '600', fontSize: '0.88rem', color: 'var(--text)', margin: 0 }}>{user?.name}</p>
                        <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: 0 }}>Batch: {user?.batchCode}</p>
                    </div>
                    <button
                        onClick={logout}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            background: 'none', border: '1.5px solid rgba(220,38,38,0.25)',
                            color: 'var(--danger)', padding: '7px 14px', borderRadius: '8px',
                            cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem',
                            transition: 'background 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,0.06)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                        <LogOut size={14} /> Logout
                    </button>
                </div>
            </header>

            {/* ── Page body ── */}
            <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '3rem' }}>

                {/* Hero greeting */}
                <div style={{ marginBottom: '2rem', animation: 'fadeUp 0.4s ease' }}>
                    <h1 style={{ fontSize: '1.7rem', marginBottom: '0.3rem' }}>
                        Good {getGreeting()}, <span style={{ color: 'var(--primary)' }}>{user?.name?.split(' ')[0]}</span> 👋
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        Practice voice interviews with AI and track your progress below.
                    </p>
                </div>

                {/* Progress bar */}
                {!loading && (
                    <div className="progress-card" style={{
                        background: 'white', borderRadius: '16px', padding: '1.4rem 1.8rem',
                        marginBottom: '2.5rem', boxShadow: '0 2px 12px rgba(14,61,53,0.06)',
                        border: '1px solid rgba(14,61,53,0.08)',
                        display: 'flex', alignItems: 'center', gap: '1.5rem',
                        animation: 'fadeUp 0.45s ease',
                    }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '12px',
                            background: totalDone === 5 ? '#dcfce7' : 'rgba(14,61,53,0.08)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                            <Trophy size={22} color={totalDone === 5 ? '#16a34a' : 'var(--primary)'} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span style={{ fontWeight: '700', fontSize: '0.88rem', color: 'var(--text)' }}>
                                    Overall Progress
                                </span>
                                <span style={{ fontWeight: '800', fontSize: '0.88rem', color: 'var(--primary)' }}>
                                    {totalDone} / 5 Completed
                                </span>
                            </div>
                            <div style={{ background: '#e6eeec', borderRadius: '100px', height: '8px', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%', borderRadius: '100px',
                                    width: `${(totalDone / 5) * 100}%`,
                                    background: 'linear-gradient(90deg, var(--primary), #2d9e7a)',
                                    transition: 'width 0.8s ease',
                                }} />
                            </div>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                        Loading topics...
                    </div>
                ) : (
                    <>
                        {/* ── AVAILABLE ── */}
                        {available.length > 0 && (
                            <div style={{ marginBottom: '2.5rem' }}>
                                <SectionLabel text="Available Now" dot="#4ade80" />
                                <div className="topic-grid">
                                    {available.map(item => <AvailableCard key={item.topic} item={item} navigate={navigate} />)}
                                </div>
                            </div>
                        )}

                        {/* ── COMPLETED ── */}
                        {completed.length > 0 && (
                            <div style={{ marginBottom: '2.5rem' }}>
                                <SectionLabel text="Completed" dot="#16a34a" />
                                <div className="topic-grid">
                                    {completed.map(item => <CompletedCard key={item.topic} item={item} />)}
                                </div>
                            </div>
                        )}

                        {/* ── LOCKED ── */}
                        {locked.length > 0 && (
                            <div>
                                <SectionLabel text="Locked Topics" dot="#9ca3af" />
                                <div className="topic-grid">
                                    {locked.map(item => <LockedCard key={item.topic} item={item} />)}
                                </div>
                            </div>
                        )}

                        {status.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                                No topics configured for your batch yet. Contact your administrator.
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

/* ── Section Label ────────────────────────────────── */
const SectionLabel = ({ text, dot }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: dot }} />
        <p style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>
            {text}
        </p>
    </div>
);

/* ── Available Card ───────────────────────────────── */
const AvailableCard = ({ item, navigate }) => {
    const meta = TOPIC_META[item.topic] || { label: item.topic, color: '#0e3d35', bg: '#eef5f3' };
    const Icon = meta.icon || Play;
    return (
        <div
            onClick={() => navigate(`/interview/${item.topic}`)}
            style={{
                background: 'white', borderRadius: '16px', padding: '1.6rem',
                border: '1.5px solid rgba(14,61,53,0.1)',
                cursor: 'pointer', transition: 'all 0.25s ease',
                boxShadow: '0 2px 12px rgba(14,61,53,0.06)',
                display: 'flex', flexDirection: 'column', gap: '1.2rem',
                position: 'relative', overflow: 'hidden',
                animation: 'fadeUp 0.5s ease',
            }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(14,61,53,0.14)';
                e.currentTarget.style.borderColor = 'rgba(14,61,53,0.25)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(14,61,53,0.06)';
                e.currentTarget.style.borderColor = 'rgba(14,61,53,0.1)';
            }}
        >
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={22} color={meta.color} />
            </div>
            <div>
                <h3 style={{ color: 'var(--text)', marginBottom: '0.3rem', fontSize: '1.05rem' }}>{meta.label}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>Voice interview · AI evaluated</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.8rem', borderTop: '1px solid rgba(14,61,53,0.08)' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--primary)' }}>Start Interview</span>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronRight size={16} color="white" />
                </div>
            </div>
        </div>
    );
};

/* ── Completed Card ───────────────────────────────── */
const CompletedCard = ({ item }) => {
    const meta = TOPIC_META[item.topic] || { label: item.topic, color: '#0e3d35', bg: '#eef5f3' };
    const Icon = meta.icon || CheckCircle;
    const score = parseScore(item.score);
    return (
        <div style={{
            background: 'white', borderRadius: '16px', padding: '1.6rem',
            border: '1.5px solid #bbf7d0',
            boxShadow: '0 2px 12px rgba(22,163,74,0.08)',
            display: 'flex', flexDirection: 'column', gap: '1.2rem',
            position: 'relative', overflow: 'hidden',
            animation: 'fadeUp 0.5s ease',
        }}>
            {/* Completed ribbon */}
            <div style={{
                position: 'absolute', top: '12px', right: '12px',
                background: '#dcfce7', color: '#16a34a',
                borderRadius: '100px', padding: '3px 10px',
                fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.5px',
                display: 'flex', alignItems: 'center', gap: '4px',
            }}>
                <CheckCircle size={11} /> Done
            </div>

            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={22} color={meta.color} />
            </div>

            <div>
                <h3 style={{ color: 'var(--text)', marginBottom: '0.3rem', fontSize: '1.05rem' }}>{meta.label}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>Interview completed</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.8rem', borderTop: '1px solid rgba(22,163,74,0.12)' }}>
                {score !== null ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '500' }}>Score</span>
                        <span style={{
                            background: scoreBg(score), color: scoreColor(score),
                            borderRadius: '100px', padding: '3px 12px',
                            fontWeight: '800', fontSize: '0.9rem',
                        }}>
                            {item.score}
                        </span>
                    </div>
                ) : (
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Score processing...</span>
                )}
                <span style={{ fontSize: '0.7rem', color: '#9ca3af', fontStyle: 'italic' }}>Admin resets allowed</span>
            </div>
        </div>
    );
};

/* ── Locked Card ─────────────────────────────────── */
const LockedCard = ({ item }) => {
    const meta = TOPIC_META[item.topic] || { label: item.topic };
    const Icon = meta.icon || Lock;
    return (
        <div style={{
            background: 'rgba(255,255,255,0.6)', borderRadius: '16px', padding: '1.6rem',
            border: '1.5px solid rgba(14,61,53,0.06)', opacity: 0.65,
            display: 'flex', flexDirection: 'column', gap: '1.2rem',
            cursor: 'not-allowed',
        }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={22} color="#9ca3af" />
            </div>
            <div>
                <h3 style={{ color: '#9ca3af', marginBottom: '0.3rem' }}>{meta.label}</h3>
                <p style={{ color: '#c4ccc9', fontSize: '0.83rem' }}>Locked by administrator</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingTop: '0.8rem', borderTop: '1px solid rgba(0,0,0,0.05)', color: '#9ca3af', fontSize: '0.83rem' }}>
                <Lock size={13} /> Not available yet
            </div>
        </div>
    );
};

export default Dashboard;
