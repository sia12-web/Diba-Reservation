import { NextRequest, NextResponse } from 'next/server';
import { findAvailableTable } from '@/lib/tableAssignment';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const { date, time, partySize } = await req.json();

        if (partySize > 38) {
            return NextResponse.json({ available: false, reason: 'too_large' });
        }

        const supabase = createAdminClient();
        const result = await findAvailableTable(partySize, date, time, supabase);

        if (!result) {
            return NextResponse.json({ available: false });
        }

        return NextResponse.json({
            available: true,
            ...result
        });
    } catch (error) {
        console.error('Check availability error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
