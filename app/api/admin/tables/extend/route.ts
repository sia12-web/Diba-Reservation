import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const { tableIds, minutes } = await req.json();
        const supabase = createAdminClient();

        // 1. Find active dine_in
        const { data: dineIn } = await supabase
            .from('dine_ins')
            .select('*')
            .eq('status', 'occupied')
            .contains('table_ids', tableIds)
            .maybeSingle();

        if (dineIn) {
            const newReleaseTime = new Date(new Date(dineIn.estimated_release_at).getTime() + minutes * 60000).toISOString();
            await supabase
                .from('dine_ins')
                .update({ estimated_release_at: newReleaseTime })
                .eq('id', dineIn.id);
        }

        // 2. Also check if it's a reservation
        const { data: reservation } = await supabase
            .from('reservations')
            .select('*')
            .eq('status', 'seated')
            .contains('table_ids', tableIds)
            .maybeSingle();

        // Reservations don't have estimated_release_at in the table yet, 
        // but we treat their completion the same way via checks.
        // For now extension is mostly for dine_ins.

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Extend table error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
