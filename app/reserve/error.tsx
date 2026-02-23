"use client";

import React, { useEffect } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
            <div className="card max-w-lg w-full text-center space-y-6">
                <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-[#8B1A1A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>

                <h2 className="text-2xl font-serif font-bold text-[#8B1A1A]">Something went wrong</h2>
                <p className="text-gray-600">
                    We encountered an unexpected error while processing your request.
                    Please try again or call us at <strong>(514) 485-9999</strong> to complete your reservation.
                </p>

                <div className="flex gap-4 justify-center pt-4">
                    <button onClick={() => reset()} className="btn-primary px-8">
                        Try Again
                    </button>
                    <button onClick={() => window.location.href = '/'} className="px-8 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50">
                        Go Home
                    </button>
                </div>
            </div>
        </div>
    );
}
