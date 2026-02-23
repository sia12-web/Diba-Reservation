import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/sendEmail';

export async function POST(req: NextRequest) {
    try {
        const { blockerId, blockerType, fromTableIds, toTableIds, largeReservationId } = await req.json();
        const supabase = createAdminClient();

        // 1. Double check toTableIds are available
        const { data: locks } = await supabase.from('table_locks').select('table_id').in('table_id', toTableIds);
        if (locks && locks.length > 0) {
            return NextResponse.json({ error: 'Target tables are occupied' }, { status: 409 });
        }

        // 2. Update Blocker
        if (blockerType === 'reservation') {
            const { data: res } = await supabase
                .from('reservations')
                .update({ table_ids: toTableIds })
                .eq('id', blockerId)
                .select()
                .single();

            if (res) {
                // Update locks
                await supabase.from('table_locks').delete().in('table_id', fromTableIds);
                const newLocks = toTableIds.map((tid: number) => ({
                    table_id: tid,
                    locked_by_reservation_id: blockerId,
                    locked_until: new Date(Date.now() + 120 * 60 * 1000).toISOString() // Default 2h
                }));
                await supabase.from('table_locks').insert(newLocks);

                // Send email
                await sendEmail({
                    to: res.email,
                    template: 'table_update',
                    data: {
                        customerName: res.customer_name,
                        date: res.reservation_date,
                        time: res.reservation_time,
                        newTables: toTableIds
                    }
                });
            }
        } else {
            // Dine-in
            await supabase
                .from('dine_ins')
                .update({ table_ids: toTableIds })
                .eq('id', blockerId);

            await supabase.from('table_locks').delete().in('table_id', fromTableIds);
            const newLocks = toTableIds.map((tid: number) => ({
                table_id: tid,
                locked_by_reservation_id: `DINEIN_${blockerId}`,
                locked_until: new Date(Date.now() + 60 * 60 * 1000).toISOString() // Assume another hour
            }));
            await supabase.from('table_locks').insert(newLocks);
        }

        // 3. Clear reallocation flag on large party
        await supabase
            .from('reservations')
            .update({ requires_reallocation: false })
            .eq('id', largeReservationId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Reallocation execution error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
