import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/sendEmail';

export async function GET(req: NextRequest) {
    // Security: check if CRON_SECRET is provided by Vercel
    const authHeader = req.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const twoHoursAgo = new Date(Date.now() - 120 * 60 * 1000).toISOString();

    // Query reservations where:
    // - status is 'seated' or 'completed' (assuming seated is the trigger)
    // - seated_at exists and was more than 120 minutes ago
    // - review_sent_at is NULL
    const { data: reservations, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('status', 'seated')
        .lte('seated_at', twoHoursAgo)
        .is('review_sent_at', null);

    if (error) {
        console.error('Cron error fetching reservations:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let processed = 0;
    for (const res of reservations) {
        try {
            await sendEmail({
                to: res.email,
                template: 'review_request',
                data: {
                    customerName: res.customer_name
                }
            });

            await supabase
                .from('reservations')
                .update({ review_sent_at: new Date().toISOString() })
                .eq('id', res.id);

            processed++;
        } catch (e) {
            console.error(`Error processing review email for ${res.id}:`, e);
        }
    }

    return NextResponse.json({ processed });
}
