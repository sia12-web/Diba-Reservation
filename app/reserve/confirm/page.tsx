"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function ConfirmPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [reservationData, setReservationData] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const data = searchParams.get('reservationData');
        if (data) {
            try {
                setReservationData(JSON.parse(atob(data)));
            } catch (e) {
                console.error('Failed to decode reservation data', e);
                router.push('/reserve');
            }
        } else {
            router.push('/reserve');
        }
    }, [searchParams, router]);

    const handleConfirm = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            const res = await fetch('/api/reservations/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reservationData)
            });

            const result = await res.json();

            if (res.ok) {
                if (result.requiresDeposit) {
                    router.push(`/reserve/deposit?reservationId=${result.reservationId}`);
                } else {
                    router.push(`/reserve/confirmation?reservationId=${result.reservationId}`);
                }
            } else {
                setError(result.error || 'Failed to create reservation');
            }
        } catch (err) {
            setError('Something went wrong');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!reservationData) return <div className="text-center">Loading...</div>;

    return (
        <div className="card max-w-lg mx-auto">
            <h2 className="text-2xl font-bold mb-6">Confirm Your Reservation</h2>

            <div className="space-y-4 mb-8 text-gray-700">
                <div className="flex justify-between border-b pb-2">
                    <span className="font-medium">Name</span>
                    <span>{reservationData.customerName}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                    <span className="font-medium">Date & Time</span>
                    <span>{reservationData.date} at {reservationData.time}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                    <span className="font-medium">Party Size</span>
                    <span>{reservationData.partySize} guests</span>
                </div>
                {reservationData.partySize >= 10 && (
                    <div className="bg-blue-50 p-4 rounded-xl text-blue-800 text-sm">
                        Note: For parties of 10 or more, a deposit is required to secure your booking.
                    </div>
                )}
            </div>

            {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

            <div className="flex gap-4">
                <button
                    onClick={() => router.back()}
                    className="btn-outline flex-1"
                    disabled={isSubmitting}
                >
                    Back
                </button>
                <button
                    onClick={handleConfirm}
                    className="btn-primary flex-1"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Processing...' : 'Confirm'}
                </button>
            </div>
        </div>
    );
}

export default function ConfirmPage() {
    return (
        <Suspense fallback={<div className="text-center">Loading...</div>}>
            <ConfirmPageContent />
        </Suspense>
    );
}
