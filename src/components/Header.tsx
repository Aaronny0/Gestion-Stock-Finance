'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { FiMenu, FiMoon, FiSun } from 'react-icons/fi';

const pageTitles: Record<string, string> = {
    '/': 'Tableau de bord',
    '/stock': 'Stock & Inventaire',
    '/ventes': 'Ventes',
    '/troc': 'Troc / Échanges',
    '/finance': 'Finance & Reporting',
};

interface HeaderProps {
    onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
    const pathname = usePathname();
    const [clock, setClock] = useState('');
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // Check local storage or system preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            setIsDark(true);
            document.documentElement.classList.add('dark');
        } else {
            setIsDark(false);
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleTheme = () => {
        if (isDark) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            setIsDark(false);
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            setIsDark(true);
        }
    };

    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            setClock(
                now.toLocaleDateString('fr-FR', {
                    weekday: 'short',
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                }) +
                '  •  ' +
                now.toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                })
            );
        };
        updateClock();
        const interval = setInterval(updateClock, 1000);
        return () => clearInterval(interval);
    }, []);

    const title = pageTitles[pathname] || 'ES STORE';

    return (
        <header className="header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button className="mobile-menu-btn" onClick={onMenuToggle}>
                    <FiMenu />
                </button>
                <h1 className="header-title">{title}</h1>
            </div>
            <div className="header-right">
                <button
                    onClick={toggleTheme}
                    className="btn btn-ghost"
                    style={{ padding: '8px', borderRadius: '50%' }}
                    title={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
                >
                    {isDark ? <FiSun /> : <FiMoon />}
                </button>
                <div className="header-clock">{clock}</div>
            </div>
        </header>
    );
}
