import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    const supabase = createAdminClient();
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString();

    try {
        // 1. Find overdue checks with no response
        // We only auto-extend if they haven't responded within 10 minutes of PROMPTED_AT
        const { data: overdueChecks, error: fetchError } = await supabase
            .from('table_checks')
            .select(`
                *,
                dine_ins:dine_in_id(*),
                reservations:reservation_id(*)
            `)
            .is('responded_at', null)
            .lte('prompted_at', tenMinutesAgo);

        if (fetchError) throw fetchError;
        if (!overdueChecks || overdueChecks.length === 0) {
            return NextResponse.json({ processed: 0 });
        }

        let processedCount = 0;

        for (const check of overdueChecks) {
            // Auto-extend logic
            const extensionMinutes = 40;
            const nextPromptAt = new Date(now.getTime() + extensionMinutes * 60 * 1000).toISOString();

            // A. Update the release time in parent record
            if (check.check_type === 'dine_in' && check.dine_ins) {
                const currentRelease = new Date(check.dine_ins.estimated_release_at);
                const newReleaseAt = new Date(currentRelease.getTime() + extensionMinutes * 60 * 1000).toISOString();

                await supabase
                    .from('dine_ins')
                    .update({ estimated_release_at: newReleaseAt })
                    .eq('id', check.dine_in_id);
            } else if (check.check_type === 'reservation' && check.reservations) {
                // Reservations don't have estimated_release_at in 001 schema, 
                // but they are locked by table_locks. Let's update the lock expiry.
                await supabase
                    .from('table_locks')
                    .update({ locked_until: nextPromptAt })
                    .in('table_id', check.reservations.table_ids);
            }

            // B. Mark current check as completed/responded (auto)
            await supabase
                .from('table_checks')
                .update({
                    responded_at: now.toISOString(),
                    response: 'still_seated', // Assume they are still there
                    status: 'completed'
                })
                .eq('id', check.id);

            // C. Insert new check
            await supabase
                .from('table_checks')
                .insert({
                    reservation_id: check.reservation_id,
                    dine_in_id: check.dine_in_id,
                    check_type: check.check_type,
                    prompted_at: nextPromptAt,
                    status: 'pending'
                });

            processedCount++;
        }

        return NextResponse.json({ processed: processedCount });
    } catch (error) {
        console.error('Table check cron error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
