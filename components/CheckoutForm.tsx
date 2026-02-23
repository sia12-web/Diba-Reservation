"use client";

import React, { useState, useEffect } from 'react';
import {
    PaymentElement,
    useStripe,
    useElements
} from '@stripe/react-stripe-js';

export default function CheckoutForm({ reservationId }: { reservationId: string }) {
    const stripe = useStripe();
    const elements = useElements();

    const [message, setMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) return;

        setIsLoading(true);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/reserve/confirmation?reservationId=${reservationId}`,
            },
        });

        if (error.type === "card_error" || error.type === "validation_error") {
            setMessage(error.message || "An error occurred");
        } else {
            setMessage("An unexpected error occurred.");
        }

        setIsLoading(false);
    };

    return (
        <form id="payment-form" onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement id="payment-element" />
            <button
                disabled={isLoading || !stripe || !elements}
                id="submit"
                className="btn-primary w-full py-4 text-lg font-bold shadow-lg shadow-[#8B1A1A]/20"
            >
                <span id="button-text">
                    {isLoading ? "Processing..." : "Pay $50 Deposit & Confirm"}
                </span>
            </button>
            {message && <div id="payment-message" className="text-red-500 text-sm text-center font-medium bg-red-50 p-3 rounded-lg border border-red-100">{message}</div>}
        </form>
    );
}
