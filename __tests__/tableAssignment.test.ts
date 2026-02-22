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
    const mock = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        filter: jest.fn().mockReturnThis(),
        then: jest.fn().mockImplementation((callback) => {
            // Default behavior
            return Promise.resolve(callback({ data: [], error: null }));
        }),
    } as any;

    // Specific implementations
    mock.from.mockImplementation((table: string) => {
        return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            neq: jest.fn().mockReturnThis(),
            gt: jest.fn().mockReturnThis(),
            lt: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            filter: jest.fn().mockReturnThis(),
            then: jest.fn().mockImplementation((callback) => {
                let data: any = [];
                if (table === 'restaurant_tables') data = mockTables;
                if (table === 'table_combos') data = mockCombos;
                if (table === 'reservations') data = overrides.reservations || [];
                if (table === 'dine_ins') data = overrides.dineIns || [];
                return Promise.resolve(callback({ data, error: null }));
            }),
        };
    });

    return mock as unknown as SupabaseClient;
};

describe('Table Assignment Engine', () => {
    test('Party of 2 → gets a non-combo-critical regular table', async () => {
        const supabase = createMockSupabase();
        const result = await findAvailableTable(2, '2026-03-01', '19:00', supabase);
        expect(result).not.toBeNull();
        expect(result?.tableIds).toHaveLength(1);
        expect([1, 2, 3, 5, 7, 8, 14]).toContain(result?.tableIds[0]);
        expect(result?.requiresReallocation).toBe(false);
    });

    test('Party of 2 when only table 10 is free → gets table 10 (last resort)', async () => {
        const occupiedExcept10 = mockTables.filter(t => t.id !== 10).map(t => t.id);
        const supabase = createMockSupabase({
            reservations: [{ table_ids: occupiedExcept10, party_size: 2 }]
        });
        const result = await findAvailableTable(2, '2026-03-01', '19:00', supabase);
        expect(result?.tableIds).toEqual([10]);
    });

    test('Party of 6 → gets round table 4 or 6', async () => {
        const supabase = createMockSupabase();
        const result = await findAvailableTable(6, '2026-03-01', '19:00', supabase);
        expect([4, 6]).toContain(result?.tableIds[0]);
    });

    test('Party of 10 → gets table 11', async () => {
        const supabase = createMockSupabase();
        const result = await findAvailableTable(10, '2026-03-01', '19:00', supabase);
        expect(result?.tableIds).toEqual([11]);
    });

    test('Party of 20 → gets a valid combo', async () => {
        const supabase = createMockSupabase();
        const result = await findAvailableTable(20, '2026-03-01', '19:00', supabase);
        expect(result?.isCombo).toBe(true);
        expect(result?.tableIds).toEqual([11, 12, 13]);
    });

    test('Party of 20 when table 12 is occupied by 3-person party → returns requiresReallocation=true', async () => {
        const supabase = createMockSupabase({
            reservations: [{ table_ids: [12], party_size: 3, id: 'res1' }]
        });
        const result = await findAvailableTable(20, '2026-03-01', '19:00', supabase);
        expect(result?.requiresReallocation).toBe(true);
        expect(result?.reallocationSuggestion).toContain('table 12');
    });

    test('Party of 40 → returns null', async () => {
        const supabase = createMockSupabase();
        const result = await findAvailableTable(40, '2026-03-01', '19:00', supabase);
        expect(result).toBeNull();
    });

    test('Time slot generation for a Sunday returns last slot of 20:30', () => {
        const slots = generateTimeSlots('2026-02-22'); // Sunday
        expect(slots[slots.length - 1]).toBe('20:30');
    });

    test('Time slot generation for a Friday returns last slot of 21:00', () => {
        const slots = generateTimeSlots('2026-02-20'); // Friday
        expect(slots[slots.length - 1]).toBe('21:00');
    });
});
