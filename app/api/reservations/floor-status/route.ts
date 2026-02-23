import { NextRequest, NextResponse } from 'next/server';
import { getOccupiedTableIds, getEligibleTableIds, findAvailableTable } from '@/lib/tableAssignment';
import { createAdminClient } from '@/lib/supabase/server';
import { cancelExpiredReservations } from '@/lib/reservationExpiry';

export async function POST(req: NextRequest) {
    try {
        const { date, time, partySize } = await req.json();
        const supabase = createAdminClient();

        await cancelExpiredReservations(supabase);

        const [occupiedTableIds, eligibleTableIds, assignment] = await Promise.all([
            getOccupiedTableIds(date, time, supabase),
            getEligibleTableIds(partySize, date, time, supabase),
            findAvailableTable(partySize, date, time, supabase)
        ]);

        return NextResponse.json({
            occupiedTableIds,
            eligibleTableIds,
            suggestedTableIds: assignment?.tableIds || [],
            isCombo: assignment?.isCombo || false
        });
    } catch (error) {
        console.error('Floor status error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
