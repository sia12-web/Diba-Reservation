import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const tableId = parseInt(id);
        const supabase = createAdminClient();

        // Check dine_ins
        const { data: dineIn } = await supabase
            .from('dine_ins')
            .select('*')
            .eq('status', 'occupied')
            .contains('table_ids', [tableId])
            .maybeSingle();

        if (dineIn) {
            return NextResponse.json({
                type: 'dine_in',
                name: 'Walk-in',
                partySize: dineIn.party_size,
                seatedAt: dineIn.seated_at,
                releaseAt: dineIn.estimated_release_at,
                tableIds: dineIn.table_ids
            });
        }

        // Check reservations
        const { data: reservation } = await supabase
            .from('reservations')
            .select('*')
            .eq('status', 'seated')
            .contains('table_ids', [tableId])
            .maybeSingle();

        if (reservation) {
            return NextResponse.json({
                type: 'reservation',
                name: reservation.customer_name,
                partySize: reservation.party_size,
                seatedAt: reservation.seated_at || reservation.created_at, // Fallback if seated_at missing
                releaseAt: null, // Reservations usually use a fixed block or default duration
                tableIds: reservation.table_ids
            });
        }

        return NextResponse.json({ type: 'available', tableId: tableId });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
