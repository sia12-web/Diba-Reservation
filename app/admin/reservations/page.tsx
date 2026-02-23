"use client";

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';

export default function ReservationsListPage() {
    const [reservations, setReservations] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [status, setStatus] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const fetchReservations = async () => {
        setIsLoading(true);
        const res = await fetch(`/api/admin/reservations?date=${date}&status=${status}&page=${page}`);
        if (res.ok) {
            const data = await res.json();
            setReservations(data.reservations);
            setTotal(data.total);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchReservations();
    }, [date, status, page]);

    const handleAction = async (id: string, action: 'seat' | 'cancel') => {
        const res = await fetch(`/api/admin/reservations/${id}/${action}`, { method: 'POST' });
        if (res.ok) fetchReservations();
        else alert(`Failed to ${action}`);
    };

    const statusStyles: any = {
        confirmed: 'bg-green-100 text-green-700',
        deposit_required: 'bg-amber-100 text-amber-700',
        deposit_paid: 'bg-blue-100 text-blue-700',
        seated: 'bg-gray-100 text-gray-700',
        completed: 'bg-gray-50 text-gray-400',
        cancelled: 'bg-red-100 text-red-700',
        no_show: 'bg-orange-100 text-orange-700'
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-[#8B1A1A]">Reservations</h1>
                    <p className="text-gray-500">{total} total records found</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="input py-2 px-4 h-11"
                    />
                    <select
                        value={status}
                        onChange={e => setStatus(e.target.value)}
                        className="input py-2 px-4 h-11 min-w-[140px]"
                    >
                        <option value="all">All Status</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="deposit_required">Deposit Req</option>
                        <option value="deposit_paid">Deposit Paid</option>
                        <option value="seated">Seated</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    <button
                        onClick={() => window.location.href = '/admin/reservations/new'}
                        className="btn-primary h-11 px-6 text-sm flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        New Booking
                    </button>
                </div>
            </div>

            <div className="card overflow-hidden !p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#FAF7F2] border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Date/Time</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Guest</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Size</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Tables</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">Loading reservations...</td></tr>
                            ) : reservations.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">No reservations found for this filter</td></tr>
                            ) : (
                                reservations.map((res) => (
                                    <React.Fragment key={res.id}>
                                        <tr
                                            className={`hover:bg-gray-50 transition-colors cursor-pointer ${expandedId === res.id ? 'bg-[#FAF7F2]/50' : ''}`}
                                            onClick={() => setExpandedId(expandedId === res.id ? null : res.id)}
                                        >
                                            <td className="px-6 py-5">
                                                <p className="font-bold text-gray-900">{format(new Date(res.reservation_date), 'MMM d, yyyy')}</p>
                                                <p className="text-xs text-[#8B1A1A] font-medium">{res.reservation_time.slice(0, 5)}</p>
                                            </td>
                                            <td className="px-6 py-5">
                                                <p className="font-bold text-gray-900">{res.customer_name}</p>
                                                <p className="text-xs text-gray-400">{res.phone || 'No phone'}</p>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className="font-bold text-gray-700">{res.party_size}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-wrap gap-1">
                                                    {res.table_ids.map((tid: number) => (
                                                        <span key={tid} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold">T{tid}</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusStyles[res.status] || 'bg-gray-100'}`}>
                                                    {res.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-right space-x-2">
                                                {res.status === 'confirmed' || res.status === 'deposit_paid' ? (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleAction(res.id, 'seat'); }}
                                                        className="text-xs font-bold text-green-600 hover:text-green-700 transition-colors"
                                                    >
                                                        Seat
                                                    </button>
                                                ) : null}
                                                {res.status !== 'cancelled' && res.status !== 'completed' ? (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleAction(res.id, 'cancel'); }}
                                                        className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                ) : null}
                                                <button className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors">
                                                    {expandedId === res.id ? 'Hide' : 'View'}
                                                </button>
                                            </td>
                                        </tr>
                                        {expandedId === res.id && (
                                            <tr className="bg-[#FAF7F2]/30 border-b border-gray-100">
                                                <td colSpan={6} className="px-8 py-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                                        <div>
                                                            <p className="text-[10px] font-bold text-[#C4973A] uppercase tracking-widest mb-2">Guest Info</p>
                                                            <p className="text-sm">Email: {res.email}</p>
                                                            <p className="text-sm">Created: {format(new Date(res.created_at), 'MMM d, yyyy HH:mm')}</p>
                                                            <p className="text-sm">Source: {res.created_by}</p>
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <p className="text-[10px] font-bold text-[#C4973A] uppercase tracking-widest mb-2">Internal Notes</p>
                                                            <p className="text-sm text-gray-600">{res.notes || 'No notes provided'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center px-4">
                <p className="text-sm text-gray-500">Showing {reservations.length} of {total}</p>
                <div className="flex gap-2">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="p-2 border border-gray-200 rounded-lg disabled:opacity-30"
                    >
                        ←
                    </button>
                    <button
                        disabled={page * 20 >= total}
                        onClick={() => setPage(p => p + 1)}
                        className="p-2 border border-gray-200 rounded-lg disabled:opacity-30"
                    >
                        →
                    </button>
                </div>
            </div>
        </div>
    );
}
