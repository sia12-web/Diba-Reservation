import { findAvailableTable } from '@/lib/tableAssignment';
import { generateTimeSlots } from '@/lib/timeSlots';
import { SupabaseClient } from '@supabase/supabase-js';

const mockTables = [
    { id: 1, label: '1', shape: 'regular', capacity_min: 1, capacity_max: 4, is_combo_critical: false, is_combinable: true },
    { id: 2, label: '2', shape: 'regular', capacity_min: 1, capacity_max: 4, is_combo_critical: false, is_combinable: true },
    { id: 3, label: '3', shape: 'regular', capacity_min: 1, capacity_max: 4, is_combo_critical: false, is_combinable: true },
    { id: 4, label: '4', shape: 'round', capacity_min: 5, capacity_max: 7, is_combo_critical: false, is_combinable: false },
    { id: 5, label: '5', shape: 'regular', capacity_min: 1, capacity_max: 4, is_combo_critical: false, is_combinable: false },
    { id: 6, label: '6', shape: 'round', capacity_min: 5, capacity_max: 7, is_combo_critical: false, is_combinable: false },
    { id: 7, label: '7', shape: 'regular', capacity_min: 1, capacity_max: 4, is_combo_critical: false, is_combinable: true },
    { id: 8, label: '8', shape: 'regular', capacity_min: 1, capacity_max: 4, is_combo_critical: false, is_combinable: true },
    { id: 9, label: '9', shape: 'large', capacity_min: 6, capacity_max: 12, is_combo_critical: false, is_combinable: true },
    { id: 10, label: '10', shape: 'regular', capacity_min: 1, capacity_max: 4, is_combo_critical: true, is_combinable: true },
    { id: 11, label: '11', shape: 'large', capacity_min: 8, capacity_max: 14, is_combo_critical: false, is_combinable: true },
    { id: 12, label: '12', shape: 'regular', capacity_min: 1, capacity_max: 4, is_combo_critical: true, is_combinable: true },
    { id: 13, label: '13', shape: 'large', capacity_min: 6, capacity_max: 12, is_combo_critical: false, is_combinable: true },
    { id: 14, label: '14', shape: 'regular', capacity_min: 1, capacity_max: 4, is_combo_critical: false, is_combinable: true },
];

const mockCombos = [
    { id: 1, table_ids: [11, 12, 13], min_capacity: 15, max_capacity: 30 },
];

const createMockSupabase = (overrides: any = {}) => {
    const createQueryBuilder = (table: string) => {
        const builder: any = {
            _table: table,
            select: jest.fn().mockImplementation(() => builder),
            eq: jest.fn().mockImplementation(() => builder),
            neq: jest.fn().mockImplementation(() => builder),
            gt: jest.fn().mockImplementation(() => builder),
            lt: jest.fn().mockImplementation(() => builder),
            order: jest.fn().mockImplementation(() => builder),
            filter: jest.fn().mockImplementation(() => builder),
            then: jest.fn().mockImplementation((callback: any) => {
                let data: any = [];
                if (table === 'restaurant_tables') data = mockTables;
                else if (table === 'table_combos') data = mockCombos;
                else if (table === 'reservations') data = overrides.reservations || [];
                else if (table === 'dine_ins') data = overrides.dineIns || [];
                return Promise.resolve(callback({ data, error: null }));
            }),
            catch: jest.fn().mockImplementation(() => builder),
        };
        return builder;
    };

    return {
        from: jest.fn().mockImplementation((table: string) => createQueryBuilder(table)),
    } as unknown as SupabaseClient;
};

describe('Table Assignment Engine', () => {
    test('1. Party of 2 -> gets a non-combo-critical regular table', async () => {
        const supabase = createMockSupabase();
        const result = await findAvailableTable(2, '2026-03-01', '19:00', supabase);
        console.log('Result 1:', result?.tableIds);
        expect(result).not.toBeNull();
        expect(result?.tableIds).toHaveLength(1);
        expect([1, 2, 3, 5, 7, 8, 14]).toContain(result?.tableIds[0]);
        expect(result?.requiresReallocation).toBe(false);
    });

    test('2. Party of 2 when only table 10 is free -> gets table 10 (last resort)', async () => {
        const occupiedExcept10 = mockTables.filter(t => t.id !== 10).map(t => t.id);
        const supabase = createMockSupabase({
            reservations: [{ table_ids: occupiedExcept10, party_size: 2 }]
        });
        const result = await findAvailableTable(2, '2026-03-01', '19:00', supabase);
        console.log('Result 2:', result?.tableIds);
        expect(result?.tableIds).toEqual([10]);
    });

    test('3. Party of 6 -> gets round table 4 or 6', async () => {
        const supabase = createMockSupabase();
        const result = await findAvailableTable(6, '2026-03-01', '19:00', supabase);
        console.log('Result 3:', result?.tableIds);
        expect([4, 6]).toContain(result?.tableIds[0]);
    });

    test('4. Party of 10 -> gets table 11', async () => {
        const supabase = createMockSupabase();
        const result = await findAvailableTable(10, '2026-03-01', '19:00', supabase);
        console.log('Result 4:', result?.tableIds);
        expect(result?.tableIds).toEqual([11]);
    });

    test('5. Party of 20 -> gets a valid combo', async () => {
        const supabase = createMockSupabase();
        const result = await findAvailableTable(20, '2026-03-01', '19:00', supabase);
        console.log('Result 5:', result?.tableIds);
        expect(result?.isCombo).toBe(true);
        expect(result?.tableIds).toEqual([11, 12, 13]);
    });

    test('6. Party of 20 when table 12 is occupied by 3-person party -> returns requiresReallocation=true', async () => {
        const supabase = createMockSupabase({
            reservations: [{ table_ids: [12], party_size: 3, id: 'res1' }]
        });
        const result = await findAvailableTable(20, '2026-03-01', '19:00', supabase);
        console.log('Result 6:', result?.requiresReallocation);
        expect(result?.requiresReallocation).toBe(true);
        expect(result?.reallocationSuggestion).toContain('table 12');
    });

    test('7. Party of 40 -> returns null', async () => {
        const supabase = createMockSupabase();
        const result = await findAvailableTable(40, '2026-03-01', '19:00', supabase);
        expect(result).toBeNull();
    });

    test('8. Time slot generation for a Sunday returns last slot of 20:30', () => {
        const slots = generateTimeSlots('2026-02-22'); // Sunday
        expect(slots[slots.length - 1]).toBe('20:30');
    });

    test('9. Time slot generation for a Friday returns last slot of 21:00', () => {
        const slots = generateTimeSlots('2026-02-20'); // Friday
        expect(slots[slots.length - 1]).toBe('21:00');
    });
});
