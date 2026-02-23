"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
    );
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const isLoginPage = pathname === '/admin/login';

    if (isLoginPage) return <>{children}</>;

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/admin/login');
    };

    const navLinks = [
        {
            name: 'Dashboard', href: '/admin/dashboard', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
            )
        },
        {
            name: 'Reservations', href: '/admin/reservations', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            )
        },
        {
            name: 'Dine-In', href: '/admin/dine-in', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
    ];

    return (
        <div className="min-h-screen bg-[#FAF7F2] flex flex-col md:flex-row">
            {/* Mobile Header */}
            <div className="md:hidden bg-[#8B1A1A] text-white p-4 flex justify-between items-center shadow-lg sticky top-0 z-50">
                <div className="flex flex-col">
                    <span className="font-serif font-bold text-xl leading-none">DIBA</span>
                    <span className="text-[10px] tracking-[0.2em] opacity-80 uppercase leading-none mt-1">Admin</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMobileMenuOpen ? "M6 18L18 6M6 6l18 18" : "M4 6h16M4 12h16m-7 6h7"} />
                    </svg>
                </button>
            </div>

            {/* Sidebar */}
            <div className={`
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 fixed md:static inset-0 z-40 w-64 bg-[#8B1A1A] text-white transition-transform duration-300 ease-in-out flex flex-col shadow-2xl
      `}>
                <div className="p-8 hidden md:block">
                    <Link href="/admin/dashboard" className="block outline-none">
                        <h1 className="text-3xl font-serif font-bold tracking-tight">DIBA</h1>
                        <p className="text-[#C4973A] tracking-[0.2em] font-light text-[10px] uppercase mt-1">Admin Portal</p>
                    </Link>
                </div>

                <nav className="flex-1 mt-4 md:mt-0 px-4 space-y-2">
                    {navLinks.map((link) => {
                        const isActive = pathname.startsWith(link.href);
                        return (
                            <Link
                                key={link.name}
                                href={link.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                    ? 'bg-[#FAF7F2] text-[#8B1A1A] font-bold shadow-lg'
                                    : 'hover:bg-[#a62a2a] text-white/80'
                                    }`}
                            >
                                {link.icon}
                                {link.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-6 border-t border-white/10">
                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-[#a62a2a] text-white/80 transition-all font-medium"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
