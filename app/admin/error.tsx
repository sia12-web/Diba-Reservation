"use client";

import React from 'react';

export default function AdminError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="p-8">
            <div className="bg-white p-12 rounded-3xl shadow-sm border border-red-100 text-center space-y-6">
                <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-red-600">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>

                <div>
                    <h2 className="text-2xl font-serif font-bold text-[#8B1A1A]">Admin Interface Error</h2>
                    <p className="text-gray-500 mt-2">The dashboard encountered a technical problem.</p>
                </div>

                {error.message && (
                    <div className="bg-gray-50 p-4 rounded-xl text-left font-mono text-xs text-red-700 overflow-x-auto">
                        {error.message}
                    </div>
                )}

                <div className="flex gap-4 justify-center pt-4">
                    <button onClick={() => reset()} className="btn-primary px-10">
                        Reload Page
                    </button>
                    <button onClick={() => window.location.href = '/admin'} className="px-10 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50">
                        Dashboard Home
                    </button>
                </div>
            </div>
        </div>
    );
}
