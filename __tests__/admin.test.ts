import { NextRequest, NextResponse } from 'next/server';
import { GET as getPendingChecks } from '@/app/api/admin/checks/pending/route';
import { POST as respondToCheck } from '@/app/api/admin/checks/respond/route';
import { POST as createDineIn } from '@/app/api/admin/dine-in/create/route';
import { POST as seatReservation } from '@/app/api/admin/reservations/[id]/seat/route';
import { POST as cancelReservation } from '@/app/api/admin/reservations/[id]/cancel/route';
import { POST as createReservation } from '@/app/api/reservations/create/route';

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

// Mock Supabase Server Client
const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    then: jest.fn().mockImplementation((cb) => Promise.resolve(cb({ data: [], error: null }))),
};

jest.mock('@/lib/supabase/server', () => ({
    createAdminClient: jest.fn(() => mockSupabase),
}));

jest.mock('@/lib/email/sendEmail', () => ({
    sendEmail: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/lib/tableAssignment', () => ({
    lockTable: jest.fn(() => Promise.resolve()),
}));

describe('Admin API Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('POST /api/admin/dine-in/create with already-occupied table -> 409', async () => {
        mockSupabase.then.mockImplementationOnce((cb) =>
            Promise.resolve(cb({ data: [{ table_id: 1 }], error: null }))
        );

        const req = new NextRequest('http://localhost/api/admin/dine-in/create', {
            method: 'POST',
            body: JSON.stringify({ tableIds: [1], partySize: 2, estimatedMinutes: 90 })
        });

        const res = await createDineIn(req);
        expect(res.status).toBe(409);
    });

    test('POST /api/admin/checks/respond with left -> completes record and releases locks', async () => {
        mockSupabase.single.mockResolvedValueOnce({
            data: { id: 'c1', dine_in_id: 'd1', check_type: 'dine_in', dine_ins: { table_ids: [1] } },
            error: null
        });

        const req = new NextRequest('http://localhost/api/admin/checks/respond', {
            method: 'POST',
            body: JSON.stringify({ checkId: 'c1', response: 'left' })
        });

        const res = await respondToCheck(req);
        expect(res.status).toBe(200);
        expect(mockSupabase.update).toHaveBeenCalled();
        expect(mockSupabase.delete).toHaveBeenCalled();
    });

    test('POST /api/admin/checks/respond with still_seated -> creates new check', async () => {
        mockSupabase.single.mockResolvedValueOnce({
            data: { id: 'c1', dine_in_id: 'd1', check_type: 'dine_in' },
            error: null
        });

        const req = new NextRequest('http://localhost/api/admin/checks/respond', {
            method: 'POST',
            body: JSON.stringify({ checkId: 'c1', response: 'still_seated' })
        });

        const res = await respondToCheck(req);
        expect(res.status).toBe(200);
        expect(mockSupabase.insert).toHaveBeenCalled();
    });

    test('POST /api/admin/reservations/[id]/seat -> status seated', async () => {
        mockSupabase.single.mockResolvedValueOnce({ data: { id: 'r1' }, error: null });

        const req = new NextRequest('http://localhost/api/admin/reservations/r1/seat', {
            method: 'POST',
            body: JSON.stringify({})
        });

        const res = await seatReservation(req, { params: Promise.resolve({ id: 'r1' }) });
        expect(res.status).toBe(200);
        expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'seated' }));
    });

    test('POST /api/admin/reservations/[id]/cancel -> status cancelled and release locks', async () => {
        mockSupabase.single.mockResolvedValueOnce({ data: { table_ids: [1] }, error: null });

        const req = new NextRequest('http://localhost/api/admin/reservations/r1/cancel', {
            method: 'POST',
            body: JSON.stringify({})
        });

        const res = await cancelReservation(req, { params: Promise.resolve({ id: 'r1' }) });
        expect(res.status).toBe(200);
        expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'cancelled' }));
        expect(mockSupabase.delete).toHaveBeenCalled();
    });

    test('Admin reservation with waived deposit, partySize 12 -> status confirmed', async () => {
        mockSupabase.single.mockResolvedValueOnce({ data: { id: 'res123' }, error: null });

        const req = new NextRequest('http://localhost/api/reservations/create', {
            method: 'POST',
            body: JSON.stringify({
                customerName: 'Admin Booking',
                email: 'admin@test.com',
                partySize: 12,
                date: '2027-01-01',
                time: '19:00',
                tableIds: [1],
                isAdmin: true,
                waiveDeposit: true
            })
        });

        const res = await createReservation(req);
        const data = await res.json();
        expect(res.status).toBe(200);
        expect(data.requiresDeposit).toBe(false);
    });
});
