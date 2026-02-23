import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/sendEmail';

export async function POST(req: NextRequest) {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature') as string;

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    const supabase = createAdminClient();

    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const reservationId = paymentIntent.metadata.reservationId;

        console.log(`Payment succeeded for reservation ${reservationId}`);

        // Update reservation
        const { error } = await supabase
            .from('reservations')
            .update({
                status: 'confirmed',
                deposit_paid: true
            })
            .eq('id', reservationId);

        if (error) {
            console.error('Error updating reservation on payment success:', error);
        } else {
            // Fetch fresh data for email
            const { data: resData } = await supabase
                .from('reservations')
                .select('*')
                .eq('id', reservationId)
                .single();

            if (resData) {
                sendEmail({
                    to: resData.email,
                    template: 'deposit_confirmation',
                    data: {
                        customerName: resData.customer_name,
                        date: resData.reservation_date,
                        time: resData.reservation_time,
                        partySize: resData.party_size,
                        tableIds: resData.table_ids
                    }
                });
            }
        }
    } else if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object;
        const reservationId = paymentIntent.metadata.reservationId;

        console.error(`Payment failed for reservation ${reservationId}`);

        await supabase
            .from('reservations')
            .update({ status: 'cancelled' })
            .eq('id', reservationId);
    }

    return NextResponse.json({ received: true });
}
