import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const { tableIds, partySize, estimatedMinutes } = await req.json();
        const supabase = createAdminClient();

        // 1. Double check occupied
        const { data: locks } = await supabase
            .from('table_locks')
            .select('table_id')
            .in('table_id', tableIds);

        if (locks && locks.length > 0) {
            return NextResponse.json({ error: 'Tables already occupied' }, { status: 409 });
        }

        // 2. Create dine_in
        const seatedAt = new Date().toISOString();
        const estimatedReleaseAt = new Date(Date.now() + estimatedMinutes * 60000).toISOString();

        const { data: dineIn, error: dineInError } = await supabase
            .from('dine_ins')
            .insert({
                table_ids: tableIds,
                party_size: partySize,
                seated_at: seatedAt,
                estimated_release_at: estimatedReleaseAt,
                status: 'occupied'
            })
            .select('id')
            .single();

        if (dineInError) throw dineInError;

        // 3. Create first table check (40 min from now)
        const promptedAt = new Date(Date.now() + 40 * 60 * 1000).toISOString();
        await supabase
            .from('table_checks')
            .insert({
                dine_in_id: dineIn.id,
                check_type: 'dine_in',
                prompted_at: promptedAt
            });

        // 4. Lock tables
        const lockData = tableIds.map((id: number) => ({
            table_id: id,
            locked_by_reservation_id: `DINEIN_${dineIn.id}`,
            locked_until: estimatedReleaseAt
        }));
        await supabase.from('table_locks').insert(lockData);

        return NextResponse.json({ success: true, dineInId: dineIn.id });
    } catch (error) {
        console.error('Dine-in create error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
