import { SupabaseClient } from '@supabase/supabase-js';

export interface Table {
    id: number;
    label: string;
    shape: 'regular' | 'round' | 'large';
    capacity_min: number;
    capacity_max: number;
    is_combo_critical: boolean;
    is_combinable: boolean;
}

export interface TableCombo {
    id: number;
    table_ids: number[];
    min_capacity: number;
    max_capacity: number;
}

export interface AssignmentResult {
    tableIds: number[];
    isCombo: boolean;
    requiresReallocation: boolean;
    reallocationSuggestion?: string;
}

export const getOccupiedTableIds = async (
    date: string,
    time: string,
    supabase: SupabaseClient
): Promise<number[]> => {
    // Convert time to minutes for easier comparison
    const [hours, minutes] = time.split(':').map(Number);
    const targetMinutes = hours * 60 + minutes;

    // 90-minute window around the time
    // Any reservation starting between (target - 89 mins) and (target + 89 mins) conflicts
    // because we assume each reservation lasts 90 mins.
    const startWindowMins = targetMinutes - 89;
    const endWindowMins = targetMinutes + 89;

    const formatTime = (totalMins: number) => {
        const h = Math.floor(Math.max(0, totalMins) / 60);
        const m = Math.max(0, totalMins) % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`;
    };

    const startTime = formatTime(startWindowMins);
    const endTime = formatTime(endWindowMins);

    // Get reservations in the window
    const { data: reservations, error: resError } = await supabase
        .from('reservations')
        .select('table_ids')
        .eq('reservation_date', date)
        .neq('status', 'cancelled')
        .neq('status', 'no_show')
        .gt('reservation_time', startTime)
        .lt('reservation_time', endTime);

    if (resError) throw resError;

    // Get active dine-ins
    // A dine-in conflicts if it's currently occupied and its estimated release is after the target time
    // Actually, for future reservations, we should check if any dine-in *will* be there.
    // But dine-ins are usually walk-ins happening NOW.
    // The request says "reserved or occupied".
    const { data: dineIns, error: dineError } = await supabase
        .from('dine_ins')
        .select('table_ids')
        .eq('status', 'occupied')
        .gt('estimated_release_at', `${date}T${time}:00`);

    if (dineError) throw dineError;

    const occupiedIds = new Set<number>();
    reservations?.forEach(res => res.table_ids.forEach((id: number) => occupiedIds.add(id)));
    dineIns?.forEach(di => di.table_ids.forEach((id: number) => occupiedIds.add(id)));

    return Array.from(occupiedIds);
};

export const findAvailableTable = async (
    partySize: number,
    date: string,
    time: string,
    supabase: SupabaseClient
): Promise<AssignmentResult | null> => {
    const occupiedIds = await getOccupiedTableIds(date, time, supabase);

    const { data: tables, error: tableError } = await supabase
        .from('restaurant_tables')
        .select('*')
        .order('id');
    if (tableError) throw tableError;

    const availableTables = (tables as Table[]).filter(t => !occupiedIds.includes(t.id));

    // Party 1–4: prefer non-combo-critical regular tables first, combo-critical only as last resort
    if (partySize >= 1 && partySize <= 4) {
        const regularTables = availableTables.filter(t => t.shape === 'regular' && t.capacity_max >= partySize);

        // Sort so non-combo-critical comes first
        const sorted = [...regularTables].sort((a, b) => {
            if (a.is_combo_critical === b.is_combo_critical) return 0;
            return a.is_combo_critical ? 1 : -1;
        });

        if (sorted.length > 0) {
            return { tableIds: [sorted[0].id], isCombo: false, requiresReallocation: false };
        }
    }

    // Party 5–7: rounds first (4,6), then large singles
    if (partySize >= 5 && partySize <= 7) {
        const rounds = availableTables.filter(t => t.shape === 'round' && t.capacity_max >= partySize);
        if (rounds.length > 0) {
            return { tableIds: [rounds[0].id], isCombo: false, requiresReallocation: false };
        }
        const large = availableTables.filter(t => t.shape === 'large' && t.capacity_max >= partySize);
        if (large.length > 0) {
            return { tableIds: [large[0].id], isCombo: false, requiresReallocation: false };
        }
    }

    // Party 6–12: large singles (9 or 13)
    if (partySize >= 6 && partySize <= 12) {
        const large = availableTables.filter(t => (t.id === 9 || t.id === 13) && t.capacity_max >= partySize);
        if (large.length > 0) {
            // Pick the one with smaller capacity_max if both available? Or just first.
            return { tableIds: [large[0].id], isCombo: false, requiresReallocation: false };
        }
    }

    // Party 8–14: table 11 first, then 2-table combos
    if (partySize >= 8 && partySize <= 14) {
        const table11 = availableTables.find(t => t.id === 11 && t.capacity_max >= partySize);
        if (table11) {
            return { tableIds: [11], isCombo: false, requiresReallocation: false };
        }
    }

    // For combos and larger parties
    const { data: combos, error: comboError } = await supabase
        .from('table_combos')
        .select('*')
        .order('max_capacity');
    if (comboError) throw comboError;

    const validCombos = (combos as TableCombo[]).filter(c =>
        c.min_capacity <= partySize && c.max_capacity >= partySize
    );

    for (const combo of validCombos) {
        const isAvailable = combo.table_ids.every(id => !occupiedIds.includes(id));
        if (isAvailable) {
            return { tableIds: combo.table_ids, isCombo: true, requiresReallocation: false };
        }
    }

    // Reallocation logic for Party 15+
    if (partySize >= 15) {
        for (const combo of validCombos) {
            // Check if any bridge table (10, 12) in this combo is occupied by a SMALL party (1-4)
            const blockers = combo.table_ids.filter(id => occupiedIds.includes(id));

            // We need to know WHO is occupying those tables.
            // For simplicity, let's check if they are occupied by a reservation/dine-in with small party size.
            const criticalBlockers = blockers.filter(id => id === 10 || id === 12);

            if (criticalBlockers.length > 0) {
                // Find if these blockers are indeed small parties
                const { data: resBlockers } = await supabase
                    .from('reservations')
                    .select('id, party_size, table_ids')
                    .eq('reservation_date', date)
                    .neq('status', 'cancelled')
                    .neq('status', 'no_show')
                    // Same window as getOccupiedTableIds
                    .gt('reservation_time', formatTime(targetMinutes - 89))
                    .lt('reservation_time', formatTime(targetMinutes + 89))
                    .filter('table_ids', 'cs', `{${criticalBlockers.join(',')}}`);

                const isSmallPartyBlocker = resBlockers?.some(r => r.party_size <= 4);

                if (isSmallPartyBlocker) {
                    const blocker = resBlockers!.find(r => r.party_size <= 4)!;
                    const blockedTableId = blocker.table_ids.find((id: number) => criticalBlockers.includes(id));

                    return {
                        tableIds: combo.table_ids,
                        isCombo: true,
                        requiresReallocation: true,
                        reallocationSuggestion: `Move party of ${blocker.party_size} from table ${blockedTableId} to a non-critical table.`
                    };
                }
            }
        }
    }

    return null;
};

export const lockTable = async (
    tableIds: number[],
    reservationId: string,
    supabase: SupabaseClient
): Promise<void> => {
    const lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const locks = tableIds.map(id => ({
        table_id: id,
        locked_by_reservation_id: reservationId,
        locked_until: lockedUntil
    }));

    const { error } = await supabase
        .from('table_locks')
        .upsert(locks);

    if (error) throw error;
};
