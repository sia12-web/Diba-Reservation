import { NextRequest, NextResponse } from 'next/server';
import { GET as tableChecksCron } from '@/app/api/cron/table-checks/route';
import { GET as remindersCron } from '@/app/api/cron/reminders/route';
import { GET as reallocationAlerts } from '@/app/api/admin/reallocation-alerts/route';
import { POST as executeReallocation } from '@/app/api/admin/reallocation/execute/route';

// Proper Mocking matching other tests
jest.mock('next/server', () => ({
    NextRequest: jest.fn((url, init) => ({
        url,
        headers: { get: (n: string) => init?.headers?.[n] || null },
        json: async () => JSON.parse(init.body || '{}'),
        nextUrl: new URL(url)
    })),
    NextResponse: {
        json: jest.fn((data, init) => ({
            status: init?.status || 200,
            json: async () => data,
        })),
    },
}));

const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    filter: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockReturnThis(),
    then: jest.fn().mockImplementation((cb) => Promise.resolve(cb({ data: [], error: null }))),
};

jest.mock('@/lib/supabase/server', () => ({
    createAdminClient: jest.fn(() => mockSupabase),
}));

jest.mock('@/lib/email/sendEmail', () => ({
    sendEmail: jest.fn(() => Promise.resolve()),
}));

describe('Phase 7 Final Verification', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.CRON_SECRET = 'test_secret';
    });

    test('Cron Security', async () => {
        const req = new NextRequest('http://loc', { headers: { 'Authorization': 'wrong' } });
        const res = await tableChecksCron(req as any);
        expect(res.status).toBe(401);
    });

    test('Reminders Execution', async () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];

        mockSupabase.then.mockImplementationOnce((cb) =>
            Promise.resolve(cb({
                data: [{ id: 'r1', email: 't@t.com', customer_name: 'T', reservation_date: dateStr, reservation_time: '19:00', party_size: 2, table_ids: [1] }],
                error: null
            }))
        );

        const req = new NextRequest('http://loc', { headers: { 'Authorization': 'Bearer test_secret' } });
        const res = await remindersCron(req as any);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.processed).toBe(1);
    });

    test('Reallocation Detection', async () => {
        mockSupabase.then.mockImplementationOnce((cb) =>
            Promise.resolve(cb({
                data: [{ id: 'large', table_ids: [10, 11], party_size: 15, reservation_time: '19:00' }],
                error: null
            }))
        );
        mockSupabase.then.mockImplementationOnce((cb) =>
            Promise.resolve(cb({
                data: [{ table_id: 10, locked_by_reservation_id: 'small' }],
                error: null
            }))
        );
        mockSupabase.maybeSingle.mockResolvedValueOnce({
            data: { id: 'small', party_size: 2, customer_name: 'S' },
            error: null
        });
        // Suggestion search mock
        mockSupabase.then.mockImplementationOnce((cb) =>
            Promise.resolve(cb({
                data: [{ id: 1, capacity_max: 2, table_id: 1 }],
                error: null
            }))
        );

        const req = new NextRequest('http://loc');
        const res = await reallocationAlerts(req as any);
        const data = await res.json();

        expect(data.length).toBeGreaterThan(0);
    });
});
