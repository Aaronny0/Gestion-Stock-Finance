'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLock, FiUser, FiEye, FiEyeOff, FiArrowLeft, FiKey, FiLogIn } from 'react-icons/fi';

type ViewMode = 'login' | 'change_password';

export default function LoginPage() {
    const router = useRouter();
    const [view, setView] = useState<ViewMode>('login');
    
    // Login state
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');

    // Change password state
    const [cpUsername, setCpUsername] = useState('');
    const [cpNewPassword, setCpNewPassword] = useState('');
    const [cpConfirmPassword, setCpConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'login', username, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Erreur de connexion');
                return;
            }

            router.push('/');
            router.refresh();
        } catch {
            setError('Impossible de contacter le serveur');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (cpNewPassword !== cpConfirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        if (cpNewPassword.length < 4) {
            setError('Le mot de passe doit contenir au moins 4 caractères');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'change_password',
                    username: cpUsername,
                    newPassword: cpNewPassword,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Erreur lors de la modification');
                return;
            }

            setSuccess('Mot de passe modifié ! Vous pouvez maintenant vous connecter.');
            setTimeout(() => {
                setView('login');
                setSuccess('');
                setError('');
                setCpUsername('');
                setCpNewPassword('');
                setCpConfirmPassword('');
            }, 2500);
        } catch {
            setError('Impossible de contacter le serveur');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1117 40%, #161b22 100%)',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Animated Background Orbs */}
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                <motion.div
                    animate={{ x: [0, 80, -40, 0], y: [0, -60, 40, 0], scale: [1, 1.2, 0.9, 1] }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    style={{
                        position: 'absolute', top: '10%', left: '15%',
                        width: 400, height: 400, borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)',
                        filter: 'blur(60px)',
                    }}
                />
                <motion.div
                    animate={{ x: [0, -60, 50, 0], y: [0, 50, -30, 0], scale: [1, 0.8, 1.15, 1] }}
                    transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                    style={{
                        position: 'absolute', bottom: '10%', right: '10%',
                        width: 500, height: 500, borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(236, 72, 153, 0.1) 0%, transparent 70%)',
                        filter: 'blur(80px)',
                    }}
                />
                <motion.div
                    animate={{ x: [0, 30, -30, 0], y: [0, -40, 20, 0] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                    style={{
                        position: 'absolute', top: '50%', left: '60%',
                        width: 300, height: 300, borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)',
                        filter: 'blur(50px)',
                    }}
                />
            </div>

            {/* Login Card */}
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                style={{
                    width: '100%',
                    maxWidth: 420,
                    margin: '0 16px',
                    padding: '40px 36px',
                    borderRadius: '20px',
                    background: 'rgba(22, 27, 34, 0.85)',
                    backdropFilter: 'blur(24px)',
                    border: '1px solid rgba(99, 102, 241, 0.15)',
                    boxShadow: '0 25px 80px rgba(0, 0, 0, 0.5), 0 0 60px rgba(99, 102, 241, 0.08)',
                    position: 'relative',
                    zIndex: 10,
                }}
            >
                {/* Brand Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    style={{ textAlign: 'center', marginBottom: '36px' }}
                >
                    <h1 style={{
                        fontSize: '36px',
                        fontWeight: 900,
                        letterSpacing: '6px',
                        background: 'linear-gradient(135deg, #6366f1, #ec4899, #8b5cf6)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                    }}>
                        VORTEX
                    </h1>
                    <div style={{
                        width: '60px', height: '3px',
                        background: 'linear-gradient(90deg, #6366f1, #ec4899)',
                        borderRadius: '2px',
                        margin: '0 auto 12px',
                    }} />
                    <p style={{
                        color: 'rgba(139, 148, 158, 0.8)',
                        fontSize: '13px',
                        letterSpacing: '1px',
                    }}>
                        Gestion de Boutique
                    </p>
                </motion.div>

                <AnimatePresence mode="wait">
                    {view === 'login' ? (
                        <motion.form
                            key="login"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                            onSubmit={handleLogin}
                        >
                            {/* Username */}
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', color: '#8b949e', fontSize: '12px', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Identifiant
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <FiUser style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#484f58', fontSize: '18px' }} />
                                    <input
                                        id="login-username"
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Nom d'utilisateur"
                                        required
                                        autoFocus
                                        className="form-input"
                                        style={{
                                            width: '100%',
                                            paddingLeft: '44px',
                                            background: 'rgba(13, 17, 23, 0.6)',
                                            border: '1px solid rgba(99, 102, 241, 0.2)',
                                            borderRadius: '12px',
                                            color: '#e6edf3',
                                            fontSize: '15px',
                                            padding: '14px 14px 14px 44px',
                                            transition: 'all 0.2s ease',
                                            outline: 'none',
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = 'rgba(99, 102, 241, 0.5)'}
                                        onBlur={(e) => e.target.style.borderColor = 'rgba(99, 102, 241, 0.2)'}
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div style={{ marginBottom: '28px' }}>
                                <label style={{ display: 'block', color: '#8b949e', fontSize: '12px', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Mot de passe
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <FiLock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#484f58', fontSize: '18px' }} />
                                    <input
                                        id="login-password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••"
                                        required
                                        style={{
                                            width: '100%',
                                            background: 'rgba(13, 17, 23, 0.6)',
                                            border: '1px solid rgba(99, 102, 241, 0.2)',
                                            borderRadius: '12px',
                                            color: '#e6edf3',
                                            fontSize: '15px',
                                            padding: '14px 48px 14px 44px',
                                            transition: 'all 0.2s ease',
                                            outline: 'none',
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = 'rgba(99, 102, 241, 0.5)'}
                                        onBlur={(e) => e.target.style.borderColor = 'rgba(99, 102, 241, 0.2)'}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                                            background: 'none', border: 'none', color: '#484f58', cursor: 'pointer', padding: '4px',
                                        }}
                                    >
                                        {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Error */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8, height: 0 }}
                                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                                        exit={{ opacity: 0, y: -8, height: 0 }}
                                        style={{
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            border: '1px solid rgba(239, 68, 68, 0.3)',
                                            borderRadius: '10px',
                                            padding: '12px 16px',
                                            marginBottom: '20px',
                                            color: '#f87171',
                                            fontSize: '13px',
                                            fontWeight: 500,
                                        }}
                                    >
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Submit */}
                            <motion.button
                                type="submit"
                                disabled={loading}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    color: '#fff',
                                    fontSize: '15px',
                                    fontWeight: 700,
                                    cursor: loading ? 'wait' : 'pointer',
                                    opacity: loading ? 0.7 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)',
                                    transition: 'opacity 0.2s',
                                }}
                            >
                                {loading ? (
                                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
                                ) : (
                                    <>
                                        <FiLogIn size={18} />
                                        Se Connecter
                                    </>
                                )}
                            </motion.button>

                            {/* Forgot password link */}
                            <div style={{ textAlign: 'center', marginTop: '20px' }}>
                                <button
                                    type="button"
                                    onClick={() => { setView('change_password'); setError(''); }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#6366f1',
                                        fontSize: '13px',
                                        cursor: 'pointer',
                                        textDecoration: 'none',
                                        fontWeight: 500,
                                    }}
                                >
                                    Mot de passe oublié ?
                                </button>
                            </div>
                        </motion.form>
                    ) : (
                        <motion.form
                            key="change_password"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            onSubmit={handleChangePassword}
                        >
                            <button
                                type="button"
                                onClick={() => { setView('login'); setError(''); setSuccess(''); }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    background: 'none', border: 'none', color: '#8b949e',
                                    cursor: 'pointer', marginBottom: '20px', fontSize: '13px',
                                    padding: 0,
                                }}
                            >
                                <FiArrowLeft /> Retour à la connexion
                            </button>

                            <h3 style={{ color: '#e6edf3', fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>
                                Changer de mot de passe
                            </h3>
                            <p style={{ color: '#8b949e', fontSize: '13px', marginBottom: '24px' }}>
                                Entrez votre identifiant puis définissez un nouveau mot de passe.
                            </p>

                            {/* Username */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', color: '#8b949e', fontSize: '12px', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Identifiant
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <FiUser style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#484f58' }} />
                                    <input
                                        id="cp-username"
                                        type="text"
                                        value={cpUsername}
                                        onChange={(e) => setCpUsername(e.target.value)}
                                        placeholder="Nom d'utilisateur"
                                        required
                                        autoFocus
                                        style={{
                                            width: '100%',
                                            background: 'rgba(13, 17, 23, 0.6)',
                                            border: '1px solid rgba(99, 102, 241, 0.2)',
                                            borderRadius: '12px',
                                            color: '#e6edf3',
                                            fontSize: '15px',
                                            padding: '14px 14px 14px 44px',
                                            outline: 'none',
                                        }}
                                    />
                                </div>
                            </div>

                            {/* New Password */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', color: '#8b949e', fontSize: '12px', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Nouveau mot de passe
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <FiKey style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#484f58' }} />
                                    <input
                                        id="cp-new-password"
                                        type={showNewPassword ? 'text' : 'password'}
                                        value={cpNewPassword}
                                        onChange={(e) => setCpNewPassword(e.target.value)}
                                        placeholder="Nouveau mot de passe"
                                        required
                                        style={{
                                            width: '100%',
                                            background: 'rgba(13, 17, 23, 0.6)',
                                            border: '1px solid rgba(99, 102, 241, 0.2)',
                                            borderRadius: '12px',
                                            color: '#e6edf3',
                                            fontSize: '15px',
                                            padding: '14px 48px 14px 44px',
                                            outline: 'none',
                                        }}
                                    />
                                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#484f58', cursor: 'pointer' }}>
                                        {showNewPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', color: '#8b949e', fontSize: '12px', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Confirmer le mot de passe
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <FiLock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#484f58' }} />
                                    <input
                                        id="cp-confirm-password"
                                        type="password"
                                        value={cpConfirmPassword}
                                        onChange={(e) => setCpConfirmPassword(e.target.value)}
                                        placeholder="Confirmer le mot de passe"
                                        required
                                        style={{
                                            width: '100%',
                                            background: 'rgba(13, 17, 23, 0.6)',
                                            border: '1px solid rgba(99, 102, 241, 0.2)',
                                            borderRadius: '12px',
                                            color: '#e6edf3',
                                            fontSize: '15px',
                                            padding: '14px 14px 14px 44px',
                                            outline: 'none',
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Alerts */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        style={{
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            border: '1px solid rgba(239, 68, 68, 0.3)',
                                            borderRadius: '10px',
                                            padding: '12px 16px',
                                            marginBottom: '16px',
                                            color: '#f87171',
                                            fontSize: '13px',
                                        }}
                                    >
                                        {error}
                                    </motion.div>
                                )}
                                {success && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        style={{
                                            background: 'rgba(16, 185, 129, 0.1)',
                                            border: '1px solid rgba(16, 185, 129, 0.3)',
                                            borderRadius: '10px',
                                            padding: '12px 16px',
                                            marginBottom: '16px',
                                            color: '#34d399',
                                            fontSize: '13px',
                                        }}
                                    >
                                        ✓ {success}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Submit */}
                            <motion.button
                                type="submit"
                                disabled={loading}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #10b981, #059669)',
                                    color: '#fff',
                                    fontSize: '15px',
                                    fontWeight: 700,
                                    cursor: loading ? 'wait' : 'pointer',
                                    opacity: loading ? 0.7 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
                                }}
                            >
                                {loading ? (
                                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
                                ) : (
                                    <>
                                        <FiKey size={18} />
                                        Modifier le mot de passe
                                    </>
                                )}
                            </motion.button>
                        </motion.form>
                    )}
                </AnimatePresence>

                {/* Footer */}
                <div style={{ textAlign: 'center', marginTop: '28px', color: '#30363d', fontSize: '11px', letterSpacing: '0.5px' }}>
                    VORTEX © {new Date().getFullYear()} — Tous droits réservés
                </div>
            </motion.div>
        </div>
    );
}
