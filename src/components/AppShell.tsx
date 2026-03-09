
'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import { ToastProvider } from './Toast';

export default function AppShell({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();
    const [isReloading, setIsReloading] = useState(false);

    useEffect(() => {
        // The user wants to force login on every page refresh
        const navEntries = performance.getEntriesByType('navigation');
        if (navEntries.length > 0) {
            const navType = (navEntries[0] as PerformanceNavigationTiming).type;
            if (navType === 'reload' && pathname !== '/login') {
                setIsReloading(true);
                fetch('/api/auth', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'logout' })
                }).then(() => {
                    window.location.href = '/login';
                });
            }
        }
    }, [pathname]);

    if (isReloading) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
                <div className="loading-spinner" style={{ width: 40, height: 40, borderTopColor: 'var(--accent-primary)' }}></div>
            </div>
        );
    }

    // Login page gets full screen — no sidebar, no header
    if (pathname === '/login') {
        return <ToastProvider>{children}</ToastProvider>;
    }

    return (
        <ToastProvider>
            <div className="app-layout">
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <div className="main-area">
                    <Header onMenuToggle={() => setSidebarOpen(prev => !prev)} />
                    <main className="page-content">
                        {children}
                    </main>
                </div>
            </div>
        </ToastProvider>
    );
}
