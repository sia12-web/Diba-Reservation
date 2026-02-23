import { NextRequest, NextResponse } from 'next/server';
import { generateTimeSlots } from '@/lib/timeSlots';
import { findAvailableTable } from '@/lib/tableAssignment';
import { createAdminClient } from '@/lib/supabase/server';
import { cancelExpiredReservations } from '@/lib/reservationExpiry';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const partySizeStr = searchParams.get('partySize');

    if (!date || !partySizeStr) {
        return NextResponse.json({ error: 'Date and partySize are required' }, { status: 400 });
    }

    const partySize = parseInt(partySizeStr);
    const slots = generateTimeSlots(date);
    const supabase = createAdminClient();

    // Clean up expired locks/reservations before checking availability
    await cancelExpiredReservations(supabase);

    const results = await Promise.all(
        slots.map(async (time) => {
            try {
                const assignment = await findAvailableTable(partySize, date, time, supabase);
                return { time, available: assignment !== null };
            } catch (error) {
                console.error(`Error checking slot ${time}:`, error);
                return { time, available: false };
            }
        })
    );

    return NextResponse.json(results);
}
