import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
    try {
        const supabase = createAdminClient();
        const today = new Date().toISOString().split('T')[0];

        const { data: reservations, error } = await supabase
            .from('reservations')
            .select('*')
            .eq('reservation_date', today)
            .in('status', ['confirmed', 'deposit_paid', 'seated'])
            .order('reservation_time', { ascending: true });

        if (error) throw error;

        return NextResponse.json(reservations);
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
