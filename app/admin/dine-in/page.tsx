"use client";

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import FloorMap from '@/components/FloorMap';
import { motion, AnimatePresence } from 'framer-motion';

function DineInPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [floorStatus, setFloorStatus] = useState<any>(null);
    const [selectedTableIds, setSelectedTableIds] = useState<number[]>([]);
    const [partySize, setPartySize] = useState(2);
    const [duration, setDuration] = useState(90);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchStatus = async () => {
        const now = new Date();
        const date = now.toISOString().split('T')[0];
        const time = now.toTimeString().slice(0, 5);

        const res = await fetch('/api/reservations/floor-status', {
            method: 'POST',
            body: JSON.stringify({ date, time, partySize: 1 })
        });

        if (res.ok) {
            const data = await res.json();
            setFloorStatus(data);
        }
    };

    useEffect(() => {
        fetchStatus();
        const initialTableId = searchParams.get('tableId');
        if (initialTableId) {
            setSelectedTableIds([parseInt(initialTableId)]);
        }
    }, [searchParams]);

    const handleSeatNow = async () => {
        if (selectedTableIds.length === 0) return;
        setIsSubmitting(true);

        try {
            const res = await fetch('/api/admin/dine-in/create', {
                method: 'POST',
                body: JSON.stringify({
                    tableIds: selectedTableIds,
                    partySize,
                    estimatedMinutes: duration
                })
            });

            if (res.ok) {
                router.push('/admin/dashboard');
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to seat');
            }
        } catch (err) {
            alert('Internal error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!floorStatus) return <div className="p-8">Loading floor map...</div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-serif font-bold text-[#8B1A1A]">Dine-In Management</h1>
                <p className="text-gray-500">Seat walk-in guests and manage live tables</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 min-h-[500px]">
                    <FloorMap
                        mode="admin"
                        occupiedTableIds={floorStatus.occupiedTableIds}
                        eligibleTableIds={[]}
                        selectedTableIds={selectedTableIds}
                        onTableSelect={setSelectedTableIds}
                        showLegend={true}
                    />
                </div>

                <div className="w-full lg:w-96">
                    <div className="card sticky top-8">
                        <h3 className="text-xl font-serif font-bold text-[#8B1A1A] mb-6">Seat Guests</h3>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Selected Table(s)</label>
                                <div className="flex flex-wrap gap-2">
                                    {selectedTableIds.length > 0 ? (
                                        selectedTableIds.map(id => (
                                            <span key={id} className="px-3 py-1 bg-[#8B1A1A] text-white rounded-lg font-bold">Table {id}</span>
                                        ))
                                    ) : (
                                        <span className="text-gray-400 italic text-sm">Select a table on the map</span>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Party Size</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="38"
                                    value={partySize}
                                    onChange={(e) => setPartySize(parseInt(e.target.value))}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#8B1A1A] outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Duration</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[60, 90, 120].map(m => (
                                        <button
                                            key={m}
                                            onClick={() => setDuration(m)}
                                            className={`py-2 rounded-lg font-bold border-2 transition-all ${duration === m
                                                ? 'border-[#8B1A1A] bg-[#FAF7F2] text-[#8B1A1A]'
                                                : 'border-gray-100 text-gray-400 hover:border-gray-200'
                                                }`}
                                        >
                                            {m}m
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleSeatNow}
                                disabled={selectedTableIds.length === 0 || isSubmitting}
                                className="w-full btn-primary py-4 mt-4 shadow-lg shadow-[#8B1A1A]/20"
                            >
                                {isSubmitting ? 'Seating...' : 'Seat Now'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function DineInPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <DineInPageContent />
        </Suspense>
    );
}
