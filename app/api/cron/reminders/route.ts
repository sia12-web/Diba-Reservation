import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/sendEmail';

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    const supabase = createAdminClient();

    // Tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    try {
        const { data: reservations, error } = await supabase
            .from('reservations')
            .select('*')
            .eq('reservation_date', dateStr)
            .eq('status', 'confirmed')
            .is('reminder_sent_at', null);

        if (error) throw error;
        if (!reservations || reservations.length === 0) {
            return NextResponse.json({ processed: 0 });
        }

        let processedCount = 0;
        for (const res of reservations) {
            await sendEmail({
                to: res.email,
                template: 'reservation_reminder',
                data: {
                    customerName: res.customer_name,
                    date: res.reservation_date,
                    time: res.reservation_time,
                    partySize: res.party_size,
                    tableIds: res.table_ids
                }
            });

            await supabase
                .from('reservations')
                .update({ reminder_sent_at: new Date().toISOString() })
                .eq('id', res.id);

            processedCount++;
        }

        return NextResponse.json({ processed: processedCount });
    } catch (error) {
        console.error('Reminder cron error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
