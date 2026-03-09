
'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import { ToastProvider } from './Toast';

export default function AppShell({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();

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
