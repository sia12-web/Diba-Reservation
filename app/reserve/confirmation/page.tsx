"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface Reservation {
    id: string;
    customer_name: string;
    email: string;
    reservation_date: string;
    reservation_time: string;
    party_size: number;
    status: string;
    table_ids: number[];
    deposit_paid: boolean;
}

function ConfirmationPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const reservationId = searchParams.get('reservationId');
    const [reservation, setReservation] = useState<Reservation | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!reservationId) {
            router.push('/reserve');
            return;
        }

        async function fetchReservation() {
            try {
                const res = await fetch(`/api/reservations/get?id=${reservationId}`);
                if (res.ok) {
                    const data = await res.json();
                    setReservation(data);
                }
            } catch (err) {
                console.error('Failed to fetch reservation');
            } finally {
                setIsLoading(false);
            }
        }

        fetchReservation();
    }, [reservationId, router]);

    if (isLoading) return <div className="text-center py-20">Verifying reservation...</div>;
    if (!reservation) return <div className="text-center py-20 font-bold">Reservation not found.</div>;

    const isConfirmed = reservation.status === 'confirmed';
    const isPendingDeposit = reservation.status === 'deposit_required';

    return (
        <div className="max-w-2xl mx-auto text-center px-4">
            <div className="mb-10 pt-4">
                <h1 className="text-4xl font-serif font-bold text-[#8B1A1A]">DIBA</h1>
                <p className="text-[#C4973A] tracking-[0.2em] font-light text-xs mt-1">PERSIAN CUISINE</p>
            </div>

            {isConfirmed ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="card py-12"
                >
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8">
                        <motion.svg
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                            className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </motion.svg>
                    </div>

                    <h2 className="text-3xl font-bold mb-4 text-[#8B1A1A]">Reservation Confirmed!</h2>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                        Thank you, {reservation.customer_name}. We've sent a confirmation email to <span className="font-semibold text-gray-900">{reservation.email}</span>.
                    </p>

                    <div className="bg-[#FAF7F2] rounded-2xl p-8 mb-8 text-left border border-[#C4973A]/10">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-[#C4973A] mb-4">Your Booking</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-xs text-gray-400 mb-1">Date</p>
                                <p className="font-bold">{reservation.reservation_date}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 mb-1">Time</p>
                                <p className="font-bold">{reservation.reservation_time}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 mb-1">Party Size</p>
                                <p className="font-bold">{reservation.party_size} Guests</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 mb-1">Table</p>
                                <p className="font-bold">{reservation.table_ids.join(', ')}</p>
                            </div>
                        </div>
                        {reservation.deposit_paid && (
                            <div className="mt-6 pt-6 border-t border-gray-200 text-sm text-green-700 font-medium flex items-center gap-2">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                $50.00 Deposit Paid and applied to your bill.
                            </div>
                        )}
                    </div>

                    <a
                        href="https://dibarestaurant.ca"
                        className="text-[#8B1A1A] font-bold hover:underline"
                    >
                        ← Return to dibarestaurant.ca
                    </a>
                </motion.div>
            ) : isPendingDeposit ? (
                <div className="card py-12">
                    <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-8">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-4">Payment Pending</h2>
                    <p className="text-gray-600 mb-8">
                        Please complete your deposit payment to secure this reservation.
                    </p>
                    <button
                        onClick={() => router.push(`/reserve/deposit?reservationId=${reservation.id}`)}
                        className="btn-primary px-8"
                    >
                        Complete Payment
                    </button>
                </div>
            ) : (
                <div className="card py-12 text-red-500">
                    <h2 className="text-2xl font-bold mb-4">Reservation Cancelled</h2>
                    <p>This reservation has been cancelled or has expired.</p>
                </div>
            )}
        </div>
    );
}

export default function ConfirmationPage() {
    return (
        <Suspense fallback={<div className="text-center py-20">Loading...</div>}>
            <ConfirmationPageContent />
        </Suspense>
    );
}
