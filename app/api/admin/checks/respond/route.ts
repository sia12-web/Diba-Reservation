import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/sendEmail';

export async function POST(req: NextRequest) {
    try {
        const { checkId, response } = await req.json();
        const supabase = createAdminClient();

        // 1. Get check details
        const { data: check } = await supabase
            .from('table_checks')
            .select('*, dine_ins(*), reservations(*)')
            .eq('id', checkId)
            .single();

        if (!check) return NextResponse.json({ error: 'Check not found' }, { status: 404 });

        // 2. Update check
        await supabase
            .from('table_checks')
            .update({
                response,
                responded_at: new Date().toISOString()
            })
            .eq('id', checkId);

        const tableIds = check.dine_ins?.table_ids || check.reservations?.table_ids;

        if (response === 'left') {
            // Mark source as completed
            if (check.dine_in_id) {
                await supabase.from('dine_ins').update({ status: 'released' }).eq('id', check.dine_in_id);
            }
            if (check.reservation_id) {
                await supabase.from('reservations').update({ status: 'completed' }).eq('id', check.reservation_id);

                // Schedule review email
                const res = check.reservations;
                sendEmail({
                    to: res.email,
                    template: 'review_request',
                    data: { customerName: res.customer_name }
                });
            }

            // Release locks
            if (tableIds) {
                await supabase.from('table_locks').delete().in('table_id', tableIds);
            }
        } else if (response === 'still_seated') {
            // New check in 40 mins
            const nextPromptAt = new Date(Date.now() + 40 * 60 * 1000).toISOString();
            await supabase.from('table_checks').insert({
                dine_in_id: check.dine_in_id,
                reservation_id: check.reservation_id,
                check_type: check.check_type,
                prompted_at: nextPromptAt
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Respond to check error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
