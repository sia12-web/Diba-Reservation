"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe-client';
import CheckoutForm from '@/components/CheckoutForm';

interface Reservation {
    id: string;
    customer_name: string;
    reservation_date: string;
    reservation_time: string;
    party_size: number;
    status: string;
    table_ids: number[];
}

function DepositPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const reservationId = searchParams.get('reservationId');

    const [reservation, setReservation] = useState<Reservation | null>(null);
    const [clientSecret, setClientSecret] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!reservationId) {
            router.push('/reserve');
            return;
        }

        async function initializePayment() {
            try {
                // 1. Fetch reservation details directly from an API we'll need for status check
                const res = await fetch(`/api/reservations/get?id=${reservationId}`);
                if (!res.ok) throw new Error('Reservation not found');
                const data = await res.json();

                if (data.status !== 'deposit_required') {
                    router.push(`/reserve/confirmation?reservationId=${reservationId}`);
                    return;
                }
                setReservation(data);

                // 2. Create PaymentIntent
                const intentRes = await fetch('/api/payments/create-intent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reservationId })
                });

                if (!intentRes.ok) {
                    const intentData = await intentRes.json();
                    throw new Error(intentData.error || 'Failed to initialize payment');
                }

                const { clientSecret } = await intentRes.json();
                setClientSecret(clientSecret);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        }

        initializePayment();
    }, [reservationId, router]);

    if (isLoading) return <div className="text-center py-20">Initializing payment...</div>;
    if (error) return <div className="text-center py-20 text-red-500">{error}</div>;
    if (!reservation) return null;

    const appearance = {
        theme: 'stripe' as const,
        variables: {
            colorPrimary: '#8B1A1A',
            colorBackground: '#ffffff',
            colorText: '#30313d',
            colorDanger: '#df1b41',
            fontFamily: 'Lato, system-ui, sans-serif',
            spacingUnit: '4px',
            borderRadius: '12px',
        },
    };

    return (
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-6">
                <div className="card">
                    <h2 className="text-2xl font-bold mb-6 text-[#8B1A1A]">Secure Your Table</h2>
                    <p className="text-gray-600 mb-8">
                        A <span className="font-bold text-gray-900">$50.00 CAD</span> deposit is required to secure your reservation for groups of 10 or more. This amount will be applied to your final bill.
                    </p>

                    {clientSecret && (
                        <Elements options={{ clientSecret, appearance }} stripe={stripePromise}>
                            <CheckoutForm reservationId={reservation.id} />
                        </Elements>
                    )}
                </div>
            </div>

            <div className="w-full md:w-80">
                <div className="card bg-[#FAF7F2] border-2 border-[#C4973A]/20">
                    <h3 className="font-bold text-lg mb-4">Reservation Details</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Name</span>
                            <span className="font-medium">{reservation.customer_name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Guests</span>
                            <span className="font-medium">{reservation.party_size}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Date</span>
                            <span className="font-medium">{reservation.reservation_date}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Time</span>
                            <span className="font-medium">{reservation.reservation_time}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Table(s)</span>
                            <span className="font-medium">{reservation.table_ids.join(', ')}</span>
                        </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <p className="text-xs text-gray-400 italic">
                            Reservations are held for 30 minutes pending payment.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function DepositPage() {
    return (
        <Suspense fallback={<div className="text-center py-20">Loading...</div>}>
            <DepositPageContent />
        </Suspense>
    );
}
