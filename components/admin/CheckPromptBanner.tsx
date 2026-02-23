"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CheckPromptBanner() {
    const [pendingChecks, setPendingChecks] = useState<any[]>([]);

    const fetchChecks = async () => {
        try {
            const res = await fetch('/api/admin/checks/pending');
            if (res.ok) {
                const data = await res.json();
                setPendingChecks(data);
            }
        } catch (err) {
            console.error('Failed to fetch checks');
        }
    };

    useEffect(() => {
        fetchChecks();
        const interval = setInterval(fetchChecks, 5 * 60 * 1000); // 5 mins
        return () => clearInterval(interval);
    }, []);

    const handleResponse = async (checkId: string, response: 'left' | 'still_seated') => {
        try {
            const res = await fetch('/api/admin/checks/respond', {
                method: 'POST',
                body: JSON.stringify({ checkId, response })
            });
            if (res.ok) {
                setPendingChecks(prev => prev.filter(c => c.id !== checkId));
            }
        } catch (err) {
            console.error('Failed to respond');
        }
    };

    if (pendingChecks.length === 0) return null;

    const current = pendingChecks[0];
    const tableIds = current.dine_ins?.table_ids || current.reservations?.table_ids || [];
    const guestName = current.dine_ins ? 'Walk-in' : current.reservations?.customer_name;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                className="bg-[#8B1A1A] text-white p-4 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 border-2 border-[#C4973A]/30 mb-8"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center animate-pulse">
                        <span className="text-xl">⏰</span>
                    </div>
                    <div>
                        <p className="font-bold">Check-in: Table {tableIds.join(' & ')}</p>
                        <p className="text-xs text-white/70">Guest: {guestName} — Has this party left?</p>
                    </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <button
                        onClick={() => handleResponse(current.id, 'left')}
                        className="flex-1 md:flex-none px-6 py-2 bg-white text-[#8B1A1A] rounded-lg font-bold hover:bg-gray-100 transition-colors"
                    >
                        Yes, they left
                    </button>
                    <button
                        onClick={() => handleResponse(current.id, 'still_seated')}
                        className="flex-1 md:flex-none px-6 py-2 border border-white/30 rounded-lg font-bold hover:bg-white/10 transition-colors"
                    >
                        Still seated
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
