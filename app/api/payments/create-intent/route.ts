import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const { reservationId } = await req.json();
        const supabase = createAdminClient();

        // 1. Fetch reservation
        const { data: reservation, error } = await supabase
            .from('reservations')
            .select('*')
            .eq('id', reservationId)
            .single();

        if (error || !reservation) {
            return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
        }

        // 2. Verify status and party size
        if (reservation.status !== 'deposit_required') {
            return NextResponse.json({ error: 'Reservation does not require a deposit' }, { status: 400 });
        }
        if (reservation.party_size < 10) {
            return NextResponse.json({ error: 'Deposit only required for parties of 10 or more' }, { status: 400 });
        }

        // 3. Create PaymentIntent ($50 CAD = 5000 cents)
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 5000,
            currency: 'cad',
            metadata: {
                reservationId: reservation.id,
                customerName: reservation.customer_name,
                email: reservation.email
            }
        });

        // 4. Store PI ID
        await supabase
            .from('reservations')
            .update({ stripe_payment_intent_id: paymentIntent.id })
            .eq('id', reservationId);

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            amount: 5000
        });
    } catch (err) {
        console.error('Create PaymentIntent error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
