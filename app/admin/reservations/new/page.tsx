"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FloorMap from '@/components/FloorMap';

export default function AdminNewReservation() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        customerName: '',
        email: '',
        phone: '',
        partySize: 2,
        date: new Date().toISOString().split('T')[0],
        time: '18:00',
        notes: '',
        waiveDeposit: true
    });
    const [selectedTableIds, setSelectedTableIds] = useState<number[]>([]);
    const [floorStatus, setFloorStatus] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchStatus = async () => {
        const res = await fetch('/api/reservations/floor-status', {
            method: 'POST',
            body: JSON.stringify({
                date: formData.date,
                time: formData.time,
                partySize: 1
            })
        });
        if (res.ok) {
            setFloorStatus(await res.json());
        }
    };

    useEffect(() => {
        fetchStatus();
    }, [formData.date, formData.time]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedTableIds.length === 0) {
            alert('Please select a table');
            return;
        }
        setIsLoading(true);

        try {
            const res = await fetch('/api/reservations/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    tableIds: selectedTableIds,
                    isAdmin: true // We should handle this flag in the API to skip deposit
                })
            });

            if (res.ok) {
                router.push('/admin/reservations');
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to create');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-serif font-bold text-[#8B1A1A]">New Phone Reservation</h1>
                <p className="text-gray-500">Internal booking tool for Diba staff</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1 space-y-6">
                    <div className="card">
                        <h3 className="text-xl font-bold mb-6">Guest Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="label">Full Name</label>
                                <input type="text" required value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} className="input w-full" />
                            </div>
                            <div>
                                <label className="label">Email</label>
                                <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="input w-full" />
                            </div>
                            <div>
                                <label className="label">Phone</label>
                                <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="input w-full" />
                            </div>
                            <div>
                                <label className="label">Date</label>
                                <input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="input w-full" />
                            </div>
                            <div>
                                <label className="label">Time</label>
                                <input type="time" required value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} className="input w-full" />
                            </div>
                            <div>
                                <label className="label">Party Size</label>
                                <input type="number" required min="1" value={formData.partySize} onChange={e => setFormData({ ...formData, partySize: parseInt(e.target.value) })} className="input w-full" />
                            </div>
                            <div className="flex items-center gap-3 pt-8">
                                <input
                                    type="checkbox"
                                    id="waive"
                                    checked={formData.waiveDeposit}
                                    onChange={e => setFormData({ ...formData, waiveDeposit: e.target.checked })}
                                    className="w-5 h-5 accent-[#8B1A1A]"
                                />
                                <label htmlFor="waive" className="text-sm font-bold text-gray-700">Waive deposit requirement</label>
                            </div>
                            <div className="md:col-span-2">
                                <label className="label">Internal Notes</label>
                                <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="input w-full h-24" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full lg:w-96 space-y-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 min-h-[400px]">
                        <h3 className="text-xl font-bold mb-6">Select Table</h3>
                        {floorStatus && (
                            <FloorMap
                                mode="admin"
                                occupiedTableIds={floorStatus.occupiedTableIds}
                                eligibleTableIds={[]}
                                selectedTableIds={selectedTableIds}
                                onTableSelect={setSelectedTableIds}
                            />
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || selectedTableIds.length === 0}
                        className="btn-primary w-full py-4 shadow-lg shadow-[#8B1A1A]/20"
                    >
                        {isLoading ? 'Creating...' : 'Confirm Reservation'}
                    </button>
                </div>
            </form>
        </div>
    );
}
