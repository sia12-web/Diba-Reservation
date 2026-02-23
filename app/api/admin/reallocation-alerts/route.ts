import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { findAvailableTable } from '@/lib/tableAssignment';

export async function GET(req: NextRequest) {
    try {
        const supabase = createAdminClient();
        const now = new Date();
        const threeHoursLater = new Date(now.getTime() + 3 * 60 * 60 * 1000);

        const todayStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().slice(0, 5);
        const limitTimeStr = threeHoursLater.toTimeString().slice(0, 5);

        // 1. Get large reservations needing reallocation
        const { data: largeRes, error } = await supabase
            .from('reservations')
            .select('*')
            .eq('reservation_date', todayStr)
            .gte('reservation_time', timeStr)
            .lte('reservation_time', limitTimeStr)
            .eq('requires_reallocation', true)
            .in('status', ['confirmed', 'deposit_paid']);

        if (error) throw error;
        if (!largeRes || largeRes.length === 0) return NextResponse.json([]);

        const alerts = [];

        for (const res of largeRes) {
            // Check locks for these tables
            const { data: locks } = await supabase
                .from('table_locks')
                .select('*')
                .in('table_id', res.table_ids);

            if (locks && locks.length > 0) {
                // Find blocker(s)
                for (const lock of locks) {
                    if (lock.locked_by_reservation_id === res.id) continue;

                    // This is a blocker
                    let blockerName = 'Unknown Guest';
                    let blockerPartySize = 0;
                    let blockerType: 'reservation' | 'dine_in' = 'dine_in';
                    let blockerId = '';

                    if (lock.locked_by_reservation_id.startsWith('DINEIN_')) {
                        const dineInId = lock.locked_by_reservation_id.split('_')[1];
                        const { data: d } = await supabase.from('dine_ins').select('*').eq('id', dineInId).maybeSingle();
                        if (d) {
                            blockerName = 'Walk-in Guest';
                            blockerPartySize = d.party_size;
                            blockerId = d.id;
                        }
                    } else {
                        const { data: r } = await supabase.from('reservations').select('*').eq('id', lock.locked_by_reservation_id).maybeSingle();
                        if (r) {
                            blockerName = r.customer_name;
                            blockerPartySize = r.party_size;
                            blockerId = r.id;
                            blockerType = 'reservation';
                        }
                    }

                    // Try to find a move for the blocker
                    const suggestion = await findAvailableTable(blockerPartySize, todayStr, timeStr, supabase);

                    alerts.push({
                        alertId: `${res.id}_${lock.table_id}`,
                        largeReservationId: res.id,
                        incomingReservation: res,
                        blockerTable: lock.table_id,
                        blockerParty: {
                            id: blockerId,
                            type: blockerType,
                            name: blockerName,
                            size: blockerPartySize,
                            tableIds: [lock.table_id] // Simplified for the alert
                        },
                        suggestedMove: suggestion ? suggestion.tableIds : null
                    });
                }
            }
        }

        return NextResponse.json(alerts);
    } catch (error) {
        console.error('Reallocation alerts error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
