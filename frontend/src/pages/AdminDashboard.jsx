import React, { useEffect, useState, useMemo } from 'react';
import { adminApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    LayoutGrid, Users, FileText, Plus, RefreshCw, LogOut,
    Lock, Unlock, Search, RotateCcw, CheckCircle, Trophy,
    TrendingUp, Filter,
} from 'lucide-react';

const TOPICS = ['meta_ads', 'google_ads', 'seo', 'digital_marketing', 'hr'];
const TOPIC_LABELS = {
    meta_ads: 'Meta Ads', google_ads: 'Google Ads', seo: 'SEO',
    digital_marketing: 'Digital Mktg', hr: 'HR',
};
const TOPIC_COLORS = {
    meta_ads: '#1877f2', google_ads: '#ea4335', seo: '#0e3d35',
    digital_marketing: '#7c3aed', hr: '#d97706',
};

/* ── helpers ── */
function parseScore(str) {
    if (!str) return null;
    const m = str.match(/^(\d+\.?\d*)/);
    return m ? parseFloat(m[1]) : null;
}
function scorePill(scoreStr) {
    const s = parseScore(scoreStr);
    if (s === null) return { bg: '#f3f4f6', color: '#9ca3af', text: '—' };
    const text = scoreStr;
    if (s >= 8) return { bg: '#dcfce7', color: '#16a34a', text };
    if (s >= 6) return { bg: '#fef9c3', color: '#b45309', text };
    return { bg: '#fee2e2', color: '#dc2626', text };
}

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('batches');
    const [batches, setBatches] = useState({});
    const [students, setStudents] = useState([]);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newBatchCode, setNewBatchCode] = useState('');
    const [search, setSearch] = useState('');
    const [batchFilter, setBatchFilter] = useState('');
    const [resetConfirm, setResetConfirm] = useState(null); // { email, topic }
    const [resetting, setResetting] = useState(null);
    const { logout, user } = useAuth();

    useEffect(() => { fetchData(); }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'batches') { const { data } = await adminApi.getBatches(); setBatches(data); }
            if (activeTab === 'students') { const { data } = await adminApi.getStudents(); setStudents(data); }
            if (activeTab === 'results') { const { data } = await adminApi.getResults(); setResults(data); }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const toggleTopic = async (batchCode, topic, current) => {
        try { await adminApi.toggleTopic(batchCode, topic, !current); fetchData(); }
        catch { alert('Failed to update status'); }
    };

    const createBatch = async (e) => {
        e.preventDefault();
        if (!newBatchCode.trim()) return;
        try { await adminApi.createBatch(newBatchCode.trim()); setNewBatchCode(''); fetchData(); }
        catch { alert('Failed to create batch'); }
    };

    const handleReset = async (email, topic) => {
        if (resetConfirm?.email === email && resetConfirm?.topic === topic) {
            setResetting(`${email}_${topic}`);
            try {
                await adminApi.resetStudentTopic(email, topic);
                setResetConfirm(null);
                fetchData();
            } catch { alert('Failed to reset topic'); }
            finally { setResetting(null); }
        } else {
            setResetConfirm({ email, topic });
            setTimeout(() => setResetConfirm(null), 4000);
        }
    };

    /* ── Stats ── */
    const stats = useMemo(() => {
        const totalStudents = students.length;
        let totalCompleted = 0, totalScoreSum = 0, totalScoreCount = 0;
        students.forEach(s => {
            TOPICS.forEach(t => {
                if (s[`${t}_Score`]) {
                    totalCompleted++;
                    const sc = parseScore(s[`${t}_Score`]);
                    if (sc !== null) { totalScoreSum += sc; totalScoreCount++; }
                }
            });
        });
        const avgScore = totalScoreCount > 0 ? (totalScoreSum / totalScoreCount).toFixed(1) : '—';
        return { totalStudents, totalCompleted, avgScore };
    }, [students]);

    /* ── Filtered students ── */
    const filteredStudents = useMemo(() => {
        return students.filter(s => {
            const matchSearch = !search ||
                (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
                (s.email || '').toLowerCase().includes(search.toLowerCase());
            const matchBatch = !batchFilter || s.batchCode === batchFilter;
            return matchSearch && matchBatch;
        });
    }, [students, search, batchFilter]);

    const uniqueBatches = useMemo(() => [...new Set(students.map(s => s.batchCode).filter(Boolean))], [students]);

    const TABS = [
        { id: 'batches', label: 'Batches', icon: LayoutGrid },
        { id: 'students', label: 'Students & Scores', icon: Users },
        { id: 'results', label: 'Results', icon: FileText },
    ];

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(145deg, #f0f5f4, #e6eeec)', fontFamily: "'Inter', system-ui, sans-serif" }}>

            {/* ── Header ── */}
            <header style={{
                background: 'linear-gradient(135deg, #0a2e26 0%, #0e3d35 100%)',
                padding: '0 2.5rem', height: '64px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                boxShadow: '0 4px 20px rgba(14,61,53,0.25)',
                position: 'sticky', top: 0, zIndex: 20,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img src="/logo-full.png" alt="RUSHIPANDIT" style={{ width: '120px', height: 'auto', filter: 'brightness(0) invert(1) opacity(0.9)' }} />
                    <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.2)' }} />
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>Admin Portal</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem' }}>{user?.name}</span>
                    <button onClick={logout} style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                        color: 'white', padding: '7px 14px', borderRadius: '8px',
                        cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem', transition: 'all 0.2s',
                    }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    >
                        <LogOut size={14} /> Logout
                    </button>
                </div>
            </header>

            <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>

                {/* ── Stats row (only on students tab) ── */}
                {activeTab === 'students' && !loading && (
                    <div className="admin-stats-grid">
                        {[
                            { label: 'Total Students', value: stats.totalStudents, icon: Users, color: '#0e3d35', bg: '#eef5f3' },
                            { label: 'Interviews Done', value: stats.totalCompleted, icon: CheckCircle, color: '#16a34a', bg: '#dcfce7' },
                            { label: 'Avg Score', value: stats.avgScore, icon: TrendingUp, color: '#7c3aed', bg: '#f3f0ff' },
                        ].map(({ label, value, icon: Icon, color, bg }) => (
                            <div key={label} style={{ background: 'white', borderRadius: '16px', padding: '1.4rem 1.6rem', boxShadow: '0 2px 12px rgba(14,61,53,0.06)', border: '1px solid rgba(14,61,53,0.08)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Icon size={20} color={color} />
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '600' }}>{label}</p>
                                    <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: 'var(--text)' }}>{value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Tabs ── */}
                <div className="admin-tabs-bar" style={{ display: 'flex', gap: '4px', background: 'rgba(14,61,53,0.08)', borderRadius: '12px', padding: '4px', marginBottom: '1.5rem' }}>
                    {TABS.map(({ id, label, icon: Icon }) => {
                        const active = activeTab === id;
                        return (
                            <button key={id} onClick={() => setActiveTab(id)} style={{
                                flex: 1, padding: '10px 16px', border: 'none', borderRadius: '9px',
                                cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem',
                                fontFamily: "'Inter', sans-serif", transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                                background: active ? 'white' : 'transparent',
                                color: active ? 'var(--primary)' : 'var(--text-muted)',
                                boxShadow: active ? '0 2px 8px rgba(14,61,53,0.1)' : 'none',
                            }}>
                                <Icon size={16} /> {label}
                            </button>
                        );
                    })}
                </div>

                {/* ── Content ── */}
                <div className="admin-content-card" style={{ background: 'white', borderRadius: '20px', padding: '2rem', boxShadow: '0 4px 24px rgba(14,61,53,0.08)', border: '1px solid rgba(14,61,53,0.08)' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> Loading data...
                            <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
                        </div>
                    ) : (
                        <>
                            {/* ═══ BATCHES TAB ═══ */}
                            {activeTab === 'batches' && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.8rem' }}>
                                        <div>
                                            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Batch Management</h2>
                                            <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Create batches and control topic access per batch</p>
                                        </div>
                                    </div>

                                    <form onSubmit={createBatch} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', padding: '1.2rem', background: '#f8faf9', borderRadius: '12px', border: '1px solid rgba(14,61,53,0.08)' }}>
                                        <input
                                            placeholder="Enter new batch code (e.g. BATCH-2026-A)"
                                            style={{ marginBottom: 0, flex: 1 }}
                                            value={newBatchCode}
                                            onChange={e => setNewBatchCode(e.target.value)}
                                        />
                                        <button type="submit" className="btn-primary" style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Plus size={16} /> Create Batch
                                        </button>
                                    </form>

                                    {Object.keys(batches).length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No batches yet. Create one above.</div>
                                    ) : (
                                        <div className="batch-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
                                            {Object.entries(batches).map(([code, topics]) => (
                                                <div key={code} style={{ border: '1.5px solid rgba(14,61,53,0.1)', borderRadius: '16px', overflow: 'hidden' }}>
                                                    <div style={{ background: 'linear-gradient(135deg, #0e3d35, #1a5c4a)', padding: '1rem 1.4rem' }}>
                                                        <h3 style={{ margin: 0, color: 'white', fontSize: '0.95rem' }}>📦 {code}</h3>
                                                        <p style={{ margin: '2px 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>
                                                            {topics.filter(t => t.unlocked).length}/{topics.length} topics unlocked
                                                        </p>
                                                    </div>
                                                    <div style={{ padding: '1rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                                                        {topics.map(t => (
                                                            <div key={t.topic} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: TOPIC_COLORS[t.topic] || '#9ca3af' }} />
                                                                    <span style={{ fontSize: '0.88rem', fontWeight: '500', color: 'var(--text)' }}>{TOPIC_LABELS[t.topic] || t.topic}</span>
                                                                </div>
                                                                <button
                                                                    onClick={() => toggleTopic(code, t.topic, t.unlocked)}
                                                                    style={{
                                                                        display: 'flex', alignItems: 'center', gap: '5px',
                                                                        padding: '5px 12px', borderRadius: '100px', border: 'none', cursor: 'pointer',
                                                                        fontWeight: '600', fontSize: '0.78rem', transition: 'all 0.2s',
                                                                        background: t.unlocked ? '#dcfce7' : '#f3f4f6',
                                                                        color: t.unlocked ? '#16a34a' : '#6b7280',
                                                                    }}
                                                                >
                                                                    {t.unlocked ? <><Unlock size={12} /> Unlocked</> : <><Lock size={12} /> Locked</>}
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ═══ STUDENTS TAB ═══ */}
                            {activeTab === 'students' && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                        <div>
                                            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Students & Interview Scores</h2>
                                            <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                View scores per topic and reset attempts
                                            </p>
                                        </div>
                                        <div className="admin-filters-row" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                            {/* Search */}
                                            <div style={{ position: 'relative' }}>
                                                <Search size={14} style={{ position: 'absolute', top: '50%', left: '10px', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                                <input
                                                    placeholder="Search students..."
                                                    value={search}
                                                    onChange={e => setSearch(e.target.value)}
                                                    style={{ paddingLeft: '32px', marginBottom: 0, width: '200px', fontSize: '0.84rem' }}
                                                />
                                            </div>
                                            {/* Batch filter */}
                                            {uniqueBatches.length > 1 && (
                                                <div style={{ position: 'relative' }}>
                                                    <Filter size={14} style={{ position: 'absolute', top: '50%', left: '10px', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                                    <select
                                                        value={batchFilter}
                                                        onChange={e => setBatchFilter(e.target.value)}
                                                        style={{ paddingLeft: '32px', marginBottom: 0, width: '160px', fontSize: '0.84rem' }}
                                                    >
                                                        <option value="">All Batches</option>
                                                        {uniqueBatches.map(b => <option key={b} value={b}>{b}</option>)}
                                                    </select>
                                                </div>
                                            )}
                                            <button onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: '1.5px solid rgba(14,61,53,0.15)', background: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: '600', fontSize: '0.82rem' }}>
                                                <RefreshCw size={14} /> Refresh
                                            </button>
                                        </div>
                                    </div>

                                    {filteredStudents.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No students found.</div>
                                    ) : (
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                                                <thead>
                                                    <tr style={{ background: '#f8faf9' }}>
                                                        <th style={thStyle}>Student</th>
                                                        <th style={thStyle}>Batch</th>
                                                        {TOPICS.map(t => (
                                                            <th key={t} style={{ ...thStyle, textAlign: 'center' }}>
                                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: TOPIC_COLORS[t] }} />
                                                                    <span>{TOPIC_LABELS[t]}</span>
                                                                </div>
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredStudents.map((s, i) => (
                                                        <tr key={s.email} style={{ borderBottom: '1px solid rgba(14,61,53,0.07)', background: i % 2 === 0 ? 'white' : '#fafcfb', transition: 'background 0.15s' }}
                                                            onMouseEnter={e => e.currentTarget.style.background = '#f0f8f5'}
                                                            onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'white' : '#fafcfb'}
                                                        >
                                                            <td style={tdStyle}>
                                                                <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text)' }}>{s.name}</div>
                                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.email}</div>
                                                            </td>
                                                            <td style={tdStyle}>
                                                                <span style={{ background: 'rgba(14,61,53,0.08)', color: 'var(--primary)', borderRadius: '100px', padding: '3px 10px', fontSize: '0.78rem', fontWeight: '600' }}>
                                                                    {s.batchCode}
                                                                </span>
                                                            </td>
                                                            {TOPICS.map(t => {
                                                                const scoreStr = s[`${t}_Score`];
                                                                const pill = scorePill(scoreStr);
                                                                const isConfirming = resetConfirm?.email === s.email && resetConfirm?.topic === t;
                                                                const isResetting = resetting === `${s.email}_${t}`;
                                                                return (
                                                                    <td key={t} style={{ ...tdStyle, textAlign: 'center' }}>
                                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                                                                            <span style={{
                                                                                background: pill.bg, color: pill.color,
                                                                                borderRadius: '100px', padding: '4px 12px',
                                                                                fontWeight: '700', fontSize: '0.82rem', minWidth: '60px', display: 'inline-block',
                                                                            }}>
                                                                                {pill.text}
                                                                            </span>
                                                                            {/* Show reset only if topic has a score */}
                                                                            {scoreStr && (
                                                                                isConfirming ? (
                                                                                    <div style={{ display: 'flex', gap: '4px' }}>
                                                                                        <button
                                                                                            onClick={() => handleReset(s.email, t)}
                                                                                            disabled={isResetting}
                                                                                            style={{ padding: '2px 8px', borderRadius: '6px', border: 'none', background: '#fee2e2', color: '#dc2626', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}
                                                                                        >
                                                                                            {isResetting ? '...' : 'Confirm'}
                                                                                        </button>
                                                                                        <button onClick={() => setResetConfirm(null)} style={{ padding: '2px 8px', borderRadius: '6px', border: 'none', background: '#f3f4f6', color: '#6b7280', fontSize: '0.72rem', fontWeight: '600', cursor: 'pointer' }}>
                                                                                            Cancel
                                                                                        </button>
                                                                                    </div>
                                                                                ) : (
                                                                                    <button
                                                                                        onClick={() => handleReset(s.email, t)}
                                                                                        title="Allow retake"
                                                                                        style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '2px 8px', borderRadius: '6px', border: '1px solid #e5e7eb', background: 'white', color: '#6b7280', fontSize: '0.72rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s' }}
                                                                                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#dc2626'; e.currentTarget.style.color = '#dc2626'; }}
                                                                                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#6b7280'; }}
                                                                                    >
                                                                                        <RotateCcw size={10} /> Reset
                                                                                    </button>
                                                                                )
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ═══ RESULTS TAB ═══ */}
                            {activeTab === 'results' && (
                                <div>
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Interview Results</h2>
                                        <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{results.length} total sessions recorded</p>
                                    </div>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                                            <thead>
                                                <tr style={{ background: '#f8faf9' }}>
                                                    {['Date', 'Student', 'Topic', 'Score', 'Feedback Summary'].map(h => (
                                                        <th key={h} style={thStyle}>{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {results.length === 0 ? (
                                                    <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No results yet.</td></tr>
                                                ) : results.map((r, i) => {
                                                    const sc = parseScore(r.Score);
                                                    const pill = scorePill(r.Score);
                                                    return (
                                                        <tr key={i} style={{ borderBottom: '1px solid rgba(14,61,53,0.07)', background: i % 2 === 0 ? 'white' : '#fafcfb' }}>
                                                            <td style={tdStyle}>
                                                                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                                                    {r.Timestamp ? new Date(r.Timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                                                </span>
                                                            </td>
                                                            <td style={tdStyle}>
                                                                <div style={{ fontWeight: '600', fontSize: '0.88rem' }}>{r.StudentEmail}</div>
                                                                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Batch: {r.BatchCode}</div>
                                                            </td>
                                                            <td style={tdStyle}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: TOPIC_COLORS[r.Topic] || '#9ca3af', flexShrink: 0 }} />
                                                                    <span style={{ fontSize: '0.88rem', textTransform: 'capitalize' }}>{(r.Topic || '').replace(/_/g, ' ')}</span>
                                                                </div>
                                                            </td>
                                                            <td style={tdStyle}>
                                                                <span style={{ background: pill.bg, color: pill.color, borderRadius: '100px', padding: '4px 12px', fontWeight: '800', fontSize: '0.88rem' }}>
                                                                    {r.Score || '—'}
                                                                </span>
                                                            </td>
                                                            <td style={{ ...tdStyle, fontSize: '0.8rem', maxWidth: '280px', color: 'var(--text-muted)' }}>
                                                                {r.Feedback ? r.Feedback.substring(0, 120) + (r.Feedback.length > 120 ? '...' : '') : '—'}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

/* ── Shared table cell styles ── */
const thStyle = {
    padding: '0.85rem 1rem',
    fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.5px',
    textTransform: 'uppercase', color: 'var(--text-muted)',
    textAlign: 'left', borderBottom: '2px solid rgba(14,61,53,0.08)',
};
const tdStyle = {
    padding: '0.9rem 1rem',
    verticalAlign: 'middle',
};

export default AdminDashboard;
