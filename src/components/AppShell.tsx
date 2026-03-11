
'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import { ToastProvider } from './Toast';
import LockScreen from './LockScreen';

export default function AppShell({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const INACTIVITY_TIME = 10 * 60 * 1000; // 10 minutes d'inactivité
        let timeoutId: NodeJS.Timeout;

        const lockApp = () => {
            setIsLocked(true);
            sessionStorage.setItem('vortex_locked', 'true');
        };

        const resetTimer = () => {
            clearTimeout(timeoutId);
            // On ne relance le timer que si on n'est pas déjà verrouillé
            if (sessionStorage.getItem('vortex_locked') !== 'true') {
                timeoutId = setTimeout(lockApp, INACTIVITY_TIME);
            }
        };

        // Vérifier au chargement si on est déjà verrouillé
        if (sessionStorage.getItem('vortex_locked') === 'true') {
            setIsLocked(true);
        } else {
            resetTimer(); // Sinon, on lance le timer
        }

        const handleActivity = () => {
            resetTimer();
        };

        const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
        activityEvents.forEach(event => {
            window.addEventListener(event, handleActivity, { passive: true });
        });

        return () => {
            clearTimeout(timeoutId);
            activityEvents.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, []);

    // Login page gets full screen — no sidebar, no header
    if (pathname === '/login') {
        return <ToastProvider>{children}</ToastProvider>;
    }

    return (
        <ToastProvider>
            {isLocked && <LockScreen onUnlock={() => {
                sessionStorage.removeItem('vortex_locked');
                setIsLocked(false);
            }} />}
            <div className="app-layout" style={{ filter: isLocked ? 'blur(4px)' : 'none', pointerEvents: isLocked ? 'none' : 'auto' }}>
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
