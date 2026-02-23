import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/sendEmail';

export async function POST(req: NextRequest) {
    try {
        const { tableIds } = await req.json();
        const supabase = createAdminClient();

        // 1. Find active dine_in or seated reservation
        const { data: dineIn } = await supabase
            .from('dine_ins')
            .select('*')
            .eq('status', 'occupied')
            .contains('table_ids', tableIds)
            .maybeSingle();

        if (dineIn) {
            await supabase
                .from('dine_ins')
                .update({ status: 'released' })
                .eq('id', dineIn.id);
        }

        const { data: reservation } = await supabase
            .from('reservations')
            .select('*')
            .eq('status', 'seated')
            .contains('table_ids', tableIds)
            .maybeSingle();

        if (reservation) {
            await supabase
                .from('reservations')
                .update({ status: 'completed' })
                .eq('id', reservation.id);

            // Schedule review email
            sendEmail({
                to: reservation.email,
                template: 'review_request',
                data: { customerName: reservation.customer_name }
            });
        }

        // 2. Delete table locks
        await supabase
            .from('table_locks')
            .delete()
            .in('table_id', tableIds);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Release table error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
