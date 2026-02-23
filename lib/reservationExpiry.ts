import { SupabaseClient } from '@supabase/supabase-js';

export async function cancelExpiredReservations(supabase: SupabaseClient): Promise<void> {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    // 1. Find expired reservations that are still pending deposit
    const { data: expired, error } = await supabase
        .from('reservations')
        .select('id, table_ids')
        .eq('status', 'deposit_required')
        .lt('created_at', thirtyMinutesAgo);

    if (error || !expired || expired.length === 0) return;

    const expiredIds = expired.map(r => r.id);
    const tableIdsToRelease = Array.from(new Set(expired.flatMap(r => r.table_ids)));

    // 2. Cancel reservations
    const { error: updateError } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .in('id', expiredIds);

    if (updateError) {
        console.error('Error cancelling expired reservations:', updateError);
        return;
    }

    // 3. Release table locks
    const { error: lockError } = await supabase
        .from('table_locks')
        .delete()
        .in('table_id', tableIdsToRelease)
        .in('locked_by_reservation_id', expiredIds);

    if (lockError) {
        console.error('Error releasing locks for expired reservations:', lockError);
    }

    console.log(`Cancelled ${expiredIds.length} expired reservations.`);
}
