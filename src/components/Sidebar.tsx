'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    FiHome, FiPackage, FiShoppingCart, FiRepeat,
    FiDollarSign, FiX
} from 'react-icons/fi';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const navItems = [
    { label: 'Tableau de bord', href: '/', icon: FiHome },
    { label: 'Stock & Inventaire', href: '/stock', icon: FiPackage },
    { label: 'Ventes', href: '/ventes', icon: FiShoppingCart },
    { label: 'Troc / Échanges', href: '/troc', icon: FiRepeat },
    { label: 'Finance', href: '/finance', icon: FiDollarSign },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();

    return (
        <>
            {isOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={onClose}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        zIndex: 99,
                        display: 'none',
                    }}
                />
            )}
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">ES</div>
                    <span className="sidebar-logo-text">ES STORE</span>
                    <button
                        className="mobile-menu-btn"
                        onClick={onClose}
                        style={{ marginLeft: 'auto' }}
                    >
                        <FiX />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <span className="nav-section-label">Menu Principal</span>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`nav-link ${isActive ? 'active' : ''}`}
                                onClick={onClose}
                            >
                                <span className="nav-link-icon">
                                    <item.icon />
                                </span>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div style={{
                    padding: '16px 20px',
                    borderTop: '1px solid var(--border-primary)',
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                }}>
                    ES STORE v1.0
                </div>
            </aside>
            <style jsx global>{`
        @media (max-width: 768px) {
          .sidebar-overlay {
            display: block !important;
          }
        }
      `}</style>
        </>
    );
}
