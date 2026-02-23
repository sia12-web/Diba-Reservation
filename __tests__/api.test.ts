import { NextRequest, NextResponse } from 'next/server';
import { POST as checkAvailability } from '@/app/api/reservations/check-availability/route';
import { POST as createReservation } from '@/app/api/reservations/create/route';
import { GET as getTimeSlots } from '@/app/api/reservations/time-slots/route';

// Mock next/server
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

// Mock next/headers
jest.mock('next/headers', () => ({
    cookies: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
    })),
}));

// Mock Supabase Server Client
jest.mock('@/lib/supabase/server', () => ({
    createAdminClient: jest.fn(() => ({
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        single: jest.fn().mockImplementation(() => Promise.resolve({ data: { id: 'res123' }, error: null })),
        order: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        then: jest.fn().mockImplementation((cb) => {
            // Return mock tables when requested
            return Promise.resolve(cb({ data: [], error: null }));
        })
    }))
}));

// Mock tableAssignment functions
jest.mock('@/lib/tableAssignment', () => ({
    findAvailableTable: jest.fn((partySize) => {
        if (partySize > 38) return null;
        return { tableIds: [1], isCombo: false, requiresReallocation: false };
    }),
    lockTable: jest.fn(() => Promise.resolve()),
    getOccupiedTableIds: jest.fn(() => Promise.resolve([]))
}));

describe('Reservation API Routes', () => {
    test('POST /api/reservations/create with partySize 9 -> status confirmed', async () => {
        const req = new NextRequest('http://localhost/api/reservations/create', {
            method: 'POST',
            body: JSON.stringify({
                customerName: 'Test User',
                email: 'test@example.com',
                partySize: 9,
                date: '2026-12-01',
                time: '19:00',
                tableIds: [1]
            })
        });

        const res = await createReservation(req);
        const data = await res.json();
        expect(res.status).toBe(200);
        expect(data.requiresDeposit).toBe(false);
    });

    test('POST /api/reservations/create with partySize 10 -> status deposit_required', async () => {
        const req = new NextRequest('http://localhost/api/reservations/create', {
            method: 'POST',
            body: JSON.stringify({
                customerName: 'Test User',
                email: 'test@example.com',
                partySize: 10,
                date: '2026-12-01',
                time: '19:00',
                tableIds: [1]
            })
        });

        const res = await createReservation(req);
        const data = await res.json();
        expect(res.status).toBe(200);
        expect(data.requiresDeposit).toBe(true);
    });

    test('POST /api/reservations/create with invalid email -> 400 validation error', async () => {
        const req = new NextRequest('http://localhost/api/reservations/create', {
            method: 'POST',
            body: JSON.stringify({
                customerName: 'Test User',
                email: 'invalid-email',
                partySize: 2,
                date: '2026-12-01',
                time: '19:00',
                tableIds: [1]
            })
        });

        const res = await createReservation(req);
        expect(res.status).toBe(400);
    });

    test('POST /api/reservations/create with past date -> 400 validation error', async () => {
        const req = new NextRequest('http://localhost/api/reservations/create', {
            method: 'POST',
            body: JSON.stringify({
                customerName: 'Test User',
                email: 'test@example.com',
                partySize: 2,
                date: '2020-01-01',
                time: '19:00',
                tableIds: [1]
            })
        });

        const res = await createReservation(req);
        expect(res.status).toBe(400);
    });

    test('GET /api/reservations/time-slots returns results', async () => {
        const req = new NextRequest('http://localhost/api/reservations/time-slots?date=2026-03-06&partySize=2');
        const res = await getTimeSlots(req);
        const data = await res.json();
        expect(res.status).toBe(200);
        expect(Array.isArray(data)).toBe(true);
        // Friday should have slots until 21:00
        const times = data.map((d: any) => d.time);
        expect(times).toContain('21:00');
    });

    test('POST /api/reservations/check-availability with partySize 39 -> too_large', async () => {
        const req = new NextRequest('http://localhost/api/reservations/check-availability', {
            method: 'POST',
            body: JSON.stringify({
                date: '2026-03-01',
                time: '19:00',
                partySize: 39
            })
        });

        const res = await checkAvailability(req);
        const data = await res.json();
        expect(data.available).toBe(false);
        expect(data.reason).toBe('too_large');
    });
});
