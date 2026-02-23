"use client";

import { usePathname } from 'next/navigation';
import React from 'react';

const steps = [
    { id: 'details', label: 'Details', path: '/reserve' },
    { id: 'table', label: 'Table', path: '/reserve/table' },
    { id: 'confirm', label: 'Confirm', path: '/reserve/confirm' },
];

export default function ReserveLayoutClient({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const getCurrentStep = () => {
        if (pathname === '/reserve') return 0;
        if (pathname.startsWith('/reserve/table')) return 1;
        if (pathname.startsWith('/reserve/confirm')) return 2;
        if (pathname.startsWith('/reserve/deposit')) return 2;
        if (pathname.startsWith('/reserve/confirmation')) return 2;
        return 0;
    };

    const currentStep = getCurrentStep();

    return (
        <div className="min-h-screen bg-[#FAF7F2] py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Make a Reservation</h1>
                    <p className="text-gray-600">Experience authentic Persian cuisine at Diba</p>
                </div>

                {/* Step Indicator */}
                <div className="flex justify-center items-center mb-12 relative">
                    {steps.map((step, index) => (
                        <React.Fragment key={step.id}>
                            <div className="flex flex-col items-center z-10">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${index <= currentStep
                                        ? 'bg-[#8B1A1A] text-white shadow-md'
                                        : 'bg-white text-gray-400 border-2 border-gray-200'
                                        }`}
                                >
                                    {index + 1}
                                </div>
                                <span className={`absolute -bottom-7 text-sm font-medium ${index === currentStep ? 'text-[#8B1A1A]' : 'text-gray-500'
                                    }`}>
                                    {step.label}
                                </span>
                            </div>
                            {index < steps.length - 1 && (
                                <div className={`w-24 h-0.5 mx-2 ${index < currentStep ? 'bg-[#8B1A1A]' : 'bg-gray-200'
                                    }`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                <div className="mt-16">
                    {children}
                </div>
            </div>
        </div>
    );
}
