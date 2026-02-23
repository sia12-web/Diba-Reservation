"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { reservationSchema, type ReservationFormData } from '@/lib/validations';
import { useRouter } from 'next/navigation';

interface TimeSlot {
    time: string;
    available: boolean;
}

export default function ReservePage() {
    const router = useRouter();
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [errorStatus, setErrorStatus] = useState<string | null>(null);

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ReservationFormData>({
        resolver: zodResolver(reservationSchema),
        defaultValues: {
            partySize: 2,
            date: new Date().toISOString().split('T')[0],
        }
    });

    const watchedDate = watch('date');
    const watchedPartySize = watch('partySize');
    const watchedTime = watch('time');

    // Load time slots when date or party size changes
    useEffect(() => {
        async function fetchSlots() {
            if (!watchedDate || !watchedPartySize) return;
            if (watchedPartySize > 38) {
                setTimeSlots([]);
                return;
            }

            setIsLoadingSlots(true);
            try {
                const res = await fetch(`/api/reservations/time-slots?date=${watchedDate}&partySize=${watchedPartySize}`);
                if (res.ok) {
                    const data = await res.json();
                    setTimeSlots(data);
                }
            } catch (err) {
                console.error('Failed to fetch slots:', err);
            } finally {
                setIsLoadingSlots(false);
            }
        }

        fetchSlots();
    }, [watchedDate, watchedPartySize]);

    const onSubmit = async (data: ReservationFormData) => {
        setErrorStatus(null);
        try {
            const res = await fetch('/api/reservations/check-availability', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: data.date,
                    time: data.time,
                    partySize: data.partySize
                })
            });

            const availability = await res.json();

            if (availability.available) {
                // Encode reservation data
                const reservationData = btoa(JSON.stringify({
                    ...data,
                    tableIds: availability.tableIds,
                    isCombo: availability.isCombo,
                    requiresReallocation: availability.requiresReallocation,
                    reallocationSuggestion: availability.reallocationSuggestion
                }));

                if (data.partySize <= 14) {
                    router.push(`/reserve/table?reservationData=${reservationData}`);
                } else {
                    router.push(`/reserve/confirm?reservationData=${reservationData}`);
                }
            } else {
                setErrorStatus(availability.reason === 'too_large'
                    ? "For parties over 38, please call us."
                    : "No tables available for this time. Please try another slot.");
            }
        } catch (err) {
            console.error('Submission error:', err);
            setErrorStatus("Something went wrong. Please try again.");
        }
    };

    return (
        <div className="card max-w-lg mx-auto">
            <h2 className="text-2xl font-bold mb-6">Reservation Details</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                        {...register('customerName')}
                        className={`input-field ${errors.customerName ? 'border-red-500' : ''}`}
                        placeholder="Shahin Shariat"
                    />
                    {errors.customerName && <p className="text-red-500 text-xs mt-1">{errors.customerName.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            {...register('email')}
                            type="email"
                            className={`input-field ${errors.email ? 'border-red-500' : ''}`}
                            placeholder="shahin@example.com"
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
                        <input
                            {...register('phone')}
                            type="tel"
                            className="input-field"
                            placeholder="(514) 000-0000"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Party Size</label>
                        <input
                            {...register('partySize', { valueAsNumber: true })}
                            type="number"
                            min="1"
                            max="50"
                            className={`input-field ${errors.partySize ? 'border-red-500' : ''}`}
                        />
                        {errors.partySize && <p className="text-red-500 text-xs mt-1">{errors.partySize.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <input
                            {...register('date')}
                            type="date"
                            className={`input-field ${errors.date ? 'border-red-500' : ''}`}
                        />
                        {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
                    </div>
                </div>

                {watchedPartySize > 38 && (
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-800 text-sm">
                        For parties over 38, please call us at <strong>(514) 485-9999</strong> to discuss our large party options and set menus.
                    </div>
                )}

                {watchedPartySize <= 38 && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Available Times</label>
                        {isLoadingSlots ? (
                            <div className="grid grid-cols-4 gap-2 animate-pulse">
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className="h-9 bg-gray-200 rounded-full" />
                                ))}
                            </div>
                        ) : timeSlots.length > 0 ? (
                            <div className="grid grid-cols-4 gap-2">
                                {timeSlots.map((slot) => (
                                    <button
                                        key={slot.time}
                                        type="button"
                                        onClick={() => setValue('time', slot.time)}
                                        className={`time-slot ${slot.available ? '' : 'unavailable'} ${watchedTime === slot.time ? 'selected' : ''}`}
                                        disabled={!slot.available}
                                    >
                                        {slot.time}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm italic">Select a date to view available times</p>
                        )}
                        {errors.time && <p className="text-red-500 text-xs mt-1">{errors.time.message}</p>}
                    </div>
                )}

                {errorStatus && (
                    <p className="text-[#8B1A1A] text-sm font-medium text-center">{errorStatus}</p>
                )}

                <button
                    type="submit"
                    disabled={watchedPartySize > 38 || !watchedTime}
                    className={`btn-primary w-full mt-4 ${(watchedPartySize > 38 || !watchedTime) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {watchedPartySize <= 14 ? 'Choose Your Table' : 'Continue to Confirmation'}
                </button>
            </form>
        </div>
    );
}
