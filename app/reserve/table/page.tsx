"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import FloorMap from '@/components/FloorMap';

function FloorMapPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [reservationData, setReservationData] = useState<any>(null);
    const [floorStatus, setFloorStatus] = useState<any>(null);
    const [selectedTableIds, setSelectedTableIds] = useState<number[]>([]);
    const [combos, setCombos] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const data = searchParams.get('reservationData');
        if (data) {
            try {
                const decoded = JSON.parse(atob(data));
                setReservationData(decoded);
            } catch (e) {
                router.push('/reserve');
            }
        } else {
            router.push('/reserve');
        }
    }, [searchParams, router]);

    useEffect(() => {
        if (!reservationData) return;

        async function fetchData() {
            setIsLoading(true);
            try {
                const [statusRes, combosRes] = await Promise.all([
                    fetch('/api/reservations/floor-status', {
                        method: 'POST',
                        body: JSON.stringify({
                            date: reservationData.date,
                            time: reservationData.time,
                            partySize: reservationData.partySize
                        })
                    }),
                    fetch('/api/reservations/combos') // Simple route to get all combos
                ]);

                if (statusRes.ok) {
                    const status = await statusRes.json();
                    setFloorStatus(status);
                    setSelectedTableIds(status.suggestedTableIds);
                }

                if (combosRes.ok) {
                    const comboData = await combosRes.json();
                    setCombos(comboData);
                }
            } catch (err) {
                console.error('Failed to fetch floor data');
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, [reservationData]);

    const handleTableSelect = (tableIds: number[]) => {
        const clickedId = tableIds[0];

        // Find if this table is part of any valid combo for this party size
        const combo = combos.find(c =>
            c.table_ids.includes(clickedId) &&
            c.min_capacity <= reservationData.partySize &&
            c.max_capacity >= reservationData.partySize
        );

        if (combo) {
            setSelectedTableIds(combo.table_ids);
        } else {
            setSelectedTableIds(tableIds);
        }
    };

    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            const finalData = {
                ...reservationData,
                tableIds: selectedTableIds
            };

            const res = await fetch('/api/reservations/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finalData)
            });

            const result = await res.json();

            if (res.ok) {
                if (reservationData.partySize >= 10) {
                    router.push(`/reserve/deposit?reservationId=${result.reservationId}`);
                } else {
                    router.push(`/reserve/confirmation?reservationId=${result.reservationId}`);
                }
            } else {
                alert(result.error || 'Failed to create reservation');
            }
        } catch (err) {
            alert('Something went wrong');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading || !reservationData || !floorStatus) return <div className="text-center py-20">Loading floor map...</div>;

    return (
        <div className="flex flex-col lg:flex-row gap-8 items-start max-w-6xl mx-auto">
            <div className="flex-1 w-full bg-white p-6 rounded-3xl shadow-sm border border-gray-100 overflow-x-auto">
                <h2 className="text-2xl font-bold mb-6">Select Your Preferred Table</h2>

                {reservationData.partySize >= 10 && (
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-3 mb-6 text-amber-800">
                        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm">
                            <span className="font-bold">Note:</span> A $50 CAD deposit is required for parties of 10 or more. You'll be prompted to pay after selecting your table.
                        </p>
                    </div>
                )}

                <FloorMap
                    occupiedTableIds={floorStatus.occupiedTableIds}
                    eligibleTableIds={floorStatus.eligibleTableIds}
                    selectedTableIds={selectedTableIds}
                    onTableSelect={handleTableSelect}
                    mode="customer"
                />
            </div>

            <div className="w-full lg:w-80 space-y-6">
                <div className="card">
                    <h3 className="text-xl font-bold mb-4">Reservation Summary</h3>
                    <div className="space-y-3 text-sm text-gray-600">
                        <div className="flex justify-between">
                            <span>Date:</span>
                            <span className="font-semibold text-gray-900">{reservationData.date}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Time:</span>
                            <span className="font-semibold text-gray-900">{reservationData.time}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Guests:</span>
                            <span className="font-semibold text-gray-900">{reservationData.partySize}</span>
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-3">Selected Table</p>
                        {selectedTableIds.length > 0 ? (
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[#FAF7F2] border-2 border-[#8B1A1A] rounded-lg flex items-center justify-center font-bold text-[#8B1A1A]">
                                        {selectedTableIds.join('+')}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">Table {selectedTableIds.join(' & ')}</p>
                                        <p className="text-xs text-gray-500">
                                            Seats up to {selectedTableIds.length * 4} guests
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-400 italic text-sm">Please select a table</p>
                        )}
                    </div>

                    <button
                        onClick={handleConfirm}
                        disabled={selectedTableIds.length === 0 || isSubmitting}
                        className={`btn-primary w-full mt-8 ${isSubmitting || selectedTableIds.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isSubmitting ? 'Reserving...' : 'Reserve This Table'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function FloorMapPage() {
    return (
        <Suspense fallback={<div className="text-center py-20">Loading...</div>}>
            <FloorMapPageContent />
        </Suspense>
    );
}
