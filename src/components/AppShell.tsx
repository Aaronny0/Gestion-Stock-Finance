'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { ToastProvider } from './Toast';

export default function AppShell({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

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
