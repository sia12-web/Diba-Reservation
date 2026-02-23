"use client";

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import FloorMap from '@/components/FloorMap';
import CheckPromptBanner from '@/components/admin/CheckPromptBanner';
import { motion, AnimatePresence } from 'framer-motion';
import ReallocationAlertBanner from '@/components/admin/ReallocationAlertBanner';

export default function AdminDashboard() {
    const [floorStatus, setFloorStatus] = useState<any>(null);
    const [selectedTable, setSelectedTable] = useState<any>(null);
    const [upcoming, setUpcoming] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);

    const fetchStatus = async () => {
        try {
            const now = new Date();
            const date = now.toISOString().split('T')[0];
            const time = now.toTimeString().slice(0, 5);

            const [statusRes, upcomingRes] = await Promise.all([
                fetch('/api/reservations/floor-status', {
                    method: 'POST',
                    body: JSON.stringify({ date, time, partySize: 1 }) // Smallest size to get all
                }),
                fetch('/api/admin/reservations/upcoming')
            ]);

            if (statusRes.ok) {
                const data = await statusRes.json();
                setFloorStatus(data);
            }

            if (upcomingRes.ok) {
                const data = await upcomingRes.json();
                setUpcoming(data);
            }
        } catch (err) {
            console.error('Refresh failed');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleTableSelect = async (tableIds: number[]) => {
        const id = tableIds[0];
        try {
            const res = await fetch(`/api/admin/tables/details/${id}`);
            if (res.ok) {
                const data = await res.json();
                setSelectedTable(data);
            }
        } catch (err) {
            console.error('Failed to get table details');
        }
    };

    const handleRelease = async (tableIds: number[]) => {
        setIsActionLoading(true);
        try {
            const res = await fetch('/api/admin/tables/release', {
                method: 'POST',
                body: JSON.stringify({ tableIds })
            });
            if (res.ok) {
                setSelectedTable(null);
                fetchStatus();
            }
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleExtend = async (tableIds: number[], minutes: number) => {
        setIsActionLoading(true);
        try {
            const res = await fetch('/api/admin/tables/extend', {
                method: 'POST',
                body: JSON.stringify({ tableIds, minutes })
            });
            if (res.ok) {
                fetchStatus();
                // Refresh details
                handleTableSelect(tableIds);
            }
        } finally {
            setIsActionLoading(false);
        }
    };

    if (isLoading) return <div className="p-8">Loading dashboard...</div>;


    return (
        <div className="space-y-8">
            <CheckPromptBanner />
            <ReallocationAlertBanner />
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-[#8B1A1A]">Live Floor Status</h1>
                    <p className="text-gray-500">Real-time view of Diba's dining room</p>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-sm bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Live Polling active
                    </div>
                </div>
            </div>

            <div className="flex flex-col xl:flex-row gap-8">
                {/* Floor Map Area */}
                <div className="flex-1 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 min-h-[600px] relative overflow-hidden">
                    <FloorMap
                        mode="admin"
                        occupiedTableIds={floorStatus?.occupiedTableIds || []}
                        eligibleTableIds={[]}
                        selectedTableIds={selectedTable ? selectedTable.tableIds || [selectedTable.tableId] : []}
                        onTableSelect={handleTableSelect}
                        showLegend={true}
                    />

                    {/* Table Detail Drawer */}
                    <AnimatePresence>
                        {selectedTable && (
                            <motion.div
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-2xl border-l border-gray-100 p-8 z-20"
                            >
                                <div className="flex justify-between items-start mb-8">
                                    <h3 className="text-2xl font-serif font-bold text-[#8B1A1A]">
                                        Table {selectedTable.tableIds?.join(' & ') || selectedTable.tableId}
                                    </h3>
                                    <button onClick={() => setSelectedTable(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                {selectedTable.type !== 'available' ? (
                                    <div className="space-y-8">
                                        <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#8B1A1A]/10">
                                            <p className="text-[10px] text-[#C4973A] uppercase tracking-wider font-bold mb-1">Current Guest</p>
                                            <p className="text-xl font-bold text-gray-900">{selectedTable.name}</p>
                                            <div className="flex gap-4 mt-3">
                                                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                                    </svg>
                                                    {selectedTable.partySize} guests
                                                </div>
                                                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    {new Date(selectedTable.seatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Actions</p>
                                            <button
                                                onClick={() => handleRelease(selectedTable.tableIds)}
                                                disabled={isActionLoading}
                                                className="w-full btn-primary bg-green-700 hover:bg-green-800 flex items-center justify-center gap-2 py-4"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                </svg>
                                                Mark as Left
                                            </button>

                                            <button
                                                onClick={() => handleExtend(selectedTable.tableIds, 40)}
                                                disabled={isActionLoading}
                                                className="w-full border-2 border-amber-200 text-amber-800 hover:bg-amber-50 px-6 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Extend 40 min
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <p className="text-gray-500 mb-8">Table is currently available</p>
                                        <button
                                            onClick={() => window.location.href = `/admin/dine-in?tableId=${selectedTable.tableId}`}
                                            className="btn-primary w-full py-4 shadow-lg shadow-[#8B1A1A]/20"
                                        >
                                            Seat Walk-in
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Upcoming Reservations Sidebar */}
                <div className="w-full xl:w-96 space-y-6">
                    <div className="card">
                        <h3 className="text-xl font-serif font-bold text-[#8B1A1A] mb-6 flex justify-between items-center">
                            Today's Bookings
                            <span className="text-xs font-sans font-bold bg-[#FAF7F2] text-[#8B1A1A] px-2.5 py-1 rounded-full border border-[#8B1A1A]/10">
                                {upcoming.length}
                            </span>
                        </h3>

                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                            {upcoming.length === 0 ? (
                                <p className="text-center text-gray-400 py-10 italic">No more bookings for today</p>
                            ) : (
                                upcoming.map((res) => (
                                    <div key={res.id} className={`p-4 rounded-2xl border transition-all ${res.status === 'seated' ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-white border-gray-100 hover:border-[#8B1A1A]/20 hover:shadow-sm'
                                        }`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="font-bold text-gray-900">{res.customer_name}</p>
                                            <span className="text-xs font-bold text-[#8B1A1A]">{res.reservation_time.slice(0, 5)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs text-gray-500">
                                            <span>{res.party_size} guests • Table {res.table_ids.join(',')}</span>
                                            <span className={`px-1.5 py-0.5 rounded-md font-bold uppercase text-[9px] ${res.status === 'seated' ? 'bg-gray-200 text-gray-600' : 'bg-green-100 text-green-700'
                                                }`}>
                                                {res.status}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <button
                            onClick={() => window.location.href = '/admin/reservations/new'}
                            className="w-full mt-6 py-3 border-2 border-dashed border-[#8B1A1A]/30 text-[#8B1A1A] rounded-xl font-bold hover:bg-[#8B1A1A]/5 transition-all flex items-center justify-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            New Phone Reservation
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
