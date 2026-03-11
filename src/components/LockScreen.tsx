'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiLock, FiUnlock, FiUser } from 'react-icons/fi';

export default function LockScreen({ onUnlock }: { onUnlock: () => void }) {
    const [usernameInput, setUsernameInput] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'login', username: usernameInput, password })
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || 'Identifiants incorrects');
                return;
            }

            onUnlock();
        } catch {
            setError('Erreur de connexion');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'logout' })
        });
        sessionStorage.removeItem('vortex_locked');
        window.location.href = '/login';
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(10, 10, 15, 0.85)', backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)'
        }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                style={{
                    width: '100%', maxWidth: 380, padding: '40px 32px',
                    background: 'var(--bg-card)', borderRadius: '24px',
                    border: '1px solid var(--border-primary)',
                    boxShadow: 'var(--shadow-lg)',
                    textAlign: 'center'
                }}
            >
                <div style={{
                    width: 64, height: 64, margin: '0 auto 20px',
                    background: 'var(--accent-primary-glow)',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--accent-primary)', fontSize: 24, border: '1px solid rgba(99, 102, 241, 0.2)'
                }}>
                    <FiLock />
                </div>

                <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                    Session Verrouillée
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 32 }}>
                    Veuillez saisir vos identifiants à nouveau pour des raisons de sécurité.
                </p>

                <form onSubmit={handleUnlock}>
                    <div style={{ marginBottom: 16, position: 'relative' }}>
                        <FiUser style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            autoFocus
                            placeholder="Identifiant"
                            value={usernameInput}
                            onChange={(e) => setUsernameInput(e.target.value)}
                            style={{
                                width: '100%', padding: '14px 14px 14px 44px',
                                background: 'var(--bg-input)', border: '1px solid var(--border-secondary)',
                                borderRadius: 12, color: 'var(--text-primary)', fontSize: 15, outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border-secondary)'}
                        />
                    </div>
                    <div style={{ marginBottom: 20, position: 'relative' }}>
                        <FiLock style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="password"
                            placeholder="Mot de passe"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                width: '100%', padding: '14px 14px 14px 44px',
                                background: 'var(--bg-input)', border: '1px solid var(--border-secondary)',
                                borderRadius: 12, color: 'var(--text-primary)', fontSize: 15, outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border-secondary)'}
                        />
                    </div>

                    {error && (
                        <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 16 }}>{error}</div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%', padding: 14, borderRadius: 12,
                            background: 'var(--gradient-primary)',
                            border: 'none', color: '#fff', fontWeight: 600, fontSize: 15,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                        }}
                    >
                        {loading ? <span style={{ width: 16, height: 16, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> : <><FiUnlock /> Déverrouiller</>}
                    </button>

                    <button
                        type="button"
                        onClick={handleLogout}
                        style={{
                            marginTop: 20, background: 'none', border: 'none',
                            color: 'var(--text-tertiary)', fontSize: 13, cursor: 'pointer'
                        }}
                    >
                        Retourner à la page de connexion
                    </button>
                    <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                </form>
            </motion.div>
        </div>
    );
}
