"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ReallocationAlertBanner() {
    const [alerts, setAlerts] = useState<any[]>([]);
    const [isExecuting, setIsExecuting] = useState<string | null>(null);

    const fetchAlerts = async () => {
        const res = await fetch('/api/admin/reallocation-alerts');
        if (res.ok) {
            setAlerts(await res.json());
        }
    };

    useEffect(() => {
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);

    const handleExecute = async (alert: any) => {
        if (!alert.suggestedMove) return;
        setIsExecuting(alert.alertId);
        try {
            const res = await fetch('/api/admin/reallocation/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    blockerId: alert.blockerParty.id,
                    blockerType: alert.blockerParty.type,
                    fromTableIds: [alert.blockerTable],
                    toTableIds: alert.suggestedMove,
                    largeReservationId: alert.largeReservationId
                })
            });

            if (res.ok) {
                setAlerts(prev => prev.filter(a => a.alertId !== alert.alertId));
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to move party');
            }
        } finally {
            setIsExecuting(null);
        }
    };

    const handleDismiss = (id: string) => {
        setAlerts(prev => prev.filter(a => a.alertId !== id));
    };

    if (alerts.length === 0) return null;

    return (
        <div className="space-y-3 mb-8">
            <AnimatePresence>
                {alerts.map((alert) => (
                    <motion.div
                        key={alert.alertId}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-amber-50 border-2 border-amber-200 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4"
                    >
                        <div className="flex items-center gap-4">
                            <div className="bg-amber-100 p-2 rounded-xl">
                                <svg className="w-6 h-6 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-amber-900">
                                    Incoming party of {alert.incomingReservation.party_size} at {alert.incomingReservation.reservation_time.slice(0, 5)} needs Table {alert.incomingReservation.table_ids.join(', ')}
                                </p>
                                <p className="text-xs text-amber-700">
                                    Table {alert.blockerTable} is occupied by {alert.blockerParty.name} (party of {alert.blockerParty.size}).
                                    {alert.suggestedMove
                                        ? ` Suggest moving them to Table ${alert.suggestedMove.join(', ')}.`
                                        : " No alternative table currently available."}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2 shrink-0">
                            {alert.suggestedMove && (
                                <button
                                    onClick={() => handleExecute(alert)}
                                    disabled={isExecuting === alert.alertId}
                                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {isExecuting === alert.alertId ? 'Moving...' : 'Move Party'}
                                </button>
                            )}
                            <button
                                onClick={() => handleDismiss(alert.alertId)}
                                className="bg-white border border-amber-200 text-amber-700 text-xs font-bold px-4 py-2 rounded-lg hover:bg-amber-100 transition-colors"
                            >
                                Dismiss
                            </button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
