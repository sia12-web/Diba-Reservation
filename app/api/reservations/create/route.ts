import { NextRequest, NextResponse } from 'next/server';
import { reservationSchema } from '@/lib/validations';
import { createAdminClient } from '@/lib/supabase/server';
import { lockTable } from '@/lib/tableAssignment';
import { sendEmail } from '@/lib/email/sendEmail';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const validated = reservationSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json({ error: validated.error.format() }, { status: 400 });
        }

        const { customerName, email, phone, partySize, date, time, tableIds, notes, isAdmin, waiveDeposit, requiresReallocation } = body;

        if (!tableIds || !Array.isArray(tableIds) || tableIds.length === 0) {
            return NextResponse.json({ error: 'tableIds are required' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // Status and deposit logic
        const requiresDeposit = partySize >= 10 && !waiveDeposit;
        const status = requiresDeposit ? 'deposit_required' : 'confirmed';

        // 1. Lock Table
        // We don't have a reservation ID yet, so we use a temporary identifier or the email
        await lockTable(tableIds, `PENDING_${email}`, supabase);

        // 2. Create Reservation
        const { data: reservation, error } = await supabase
            .from('reservations')
            .insert({
                customer_name: customerName,
                email,
                phone,
                party_size: partySize,
                reservation_date: date,
                reservation_time: time,
                table_ids: tableIds,
                status,
                notes,
                requires_reallocation: !!requiresReallocation,
                created_by: isAdmin ? 'admin' : 'customer'
            })
            .select('id')
            .single();

        if (error) {
            console.error('Reservation creation error:', error);
            return NextResponse.json({ error: 'Failed to create reservation' }, { status: 500 });
        }

        // 3. Update lock with real reservation ID
        await lockTable(tableIds, reservation.id, supabase);

        // 4. Send Confirmation
        if (requiresDeposit) {
            const expiryTime = new Date(Date.now() + 30 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            sendEmail({
                to: email,
                template: 'deposit_required',
                data: {
                    reservationId: reservation.id,
                    customerName,
                    date,
                    time,
                    partySize,
                    expiryTime
                }
            });
        } else {
            sendEmail({
                to: email,
                template: 'reservation_confirmation',
                data: {
                    customerName,
                    date,
                    time,
                    partySize,
                    tableIds
                }
            });
        }

        return NextResponse.json({
            reservationId: reservation.id,
            requiresDeposit
        });
    } catch (error) {
        console.error('Create reservation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
