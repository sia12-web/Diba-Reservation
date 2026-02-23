// MUST BE AT THE TOP
jest.mock('next/server', () => ({
    NextRequest: jest.fn((url, init) => ({
        url,
        json: async () => JSON.parse(init.body),
    })),
    NextResponse: {
        json: jest.fn((data, init) => ({
            status: init?.status || 200,
            json: async () => data,
        })),
    },
}));

import { NextRequest } from 'next/server';
import { POST as getFloorStatus } from '@/app/api/reservations/floor-status/route';

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
    createAdminClient: jest.fn(() => ({
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        filter: jest.fn().mockReturnThis(),
        then: jest.fn().mockImplementation((cb) => Promise.resolve(cb({ data: [], error: null })))
    }))
}));

jest.mock('@/lib/tableAssignment', () => {
    const original = jest.requireActual('@/lib/tableAssignment');
    return {
        ...original,
        getOccupiedTableIds: jest.fn(() => Promise.resolve([2, 3])),
        findAvailableTable: jest.fn(() => Promise.resolve({ tableIds: [11], isCombo: false })),
        getEligibleTableIds: jest.fn(() => Promise.resolve([1, 4, 10, 11]))
    };
});

describe('Floor Map logic', () => {
    test('POST /api/reservations/floor-status correctly returns states', async () => {
        const req = new NextRequest('http://localhost/api/reservations/floor-status', {
            method: 'POST',
            body: JSON.stringify({
                date: '2026-10-10',
                time: '19:00',
                partySize: 14
            })
        });

        const res = await getFloorStatus(req as any);
        const data = await res.json();

        expect(data).toHaveProperty('occupiedTableIds');
        expect(data).toHaveProperty('eligibleTableIds');
        expect(data.suggestedTableIds).toEqual([11]);
    });
});
