import { NextRequest } from 'next/server';
import { POST as createIntent } from '@/app/api/payments/create-intent/route';
import { POST as handleWebhook } from '@/app/api/payments/webhook/route';
import { cancelExpiredReservations } from '@/lib/reservationExpiry';

// Mock Stripe
jest.mock('@/lib/stripe', () => ({
    stripe: {
        paymentIntents: {
            create: jest.fn(() => Promise.resolve({ id: 'pi_123', client_secret: 'secret_123' }))
        },
        webhooks: {
            constructEvent: jest.fn((body, sig, secret) => {
                if (sig === 'invalid') throw new Error('Invalid signature');
                const parsed = JSON.parse(body);
                return { type: parsed.type, data: { object: parsed.data.object } };
            })
        }
    }
}));

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
    createAdminClient: jest.fn(() => ({
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockImplementation(() => Promise.resolve({
            data: { id: 'res123', status: 'deposit_required', party_size: 10, customer_name: 'Test', email: 'test@example.com' },
            error: null
        })),
        update: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        then: jest.fn().mockImplementation((cb) => Promise.resolve(cb({ data: [], error: null })))
    }))
}));

// Mock next/server
jest.mock('next/server', () => ({
    NextRequest: jest.fn((url, init) => ({
        url,
        json: async () => JSON.parse(init.body),
        text: async () => init.body,
        headers: { get: (name: string) => name === 'stripe-signature' ? 'valid' : 'valid' }
    })),
    NextResponse: {
        json: jest.fn((data, init) => ({
            status: init?.status || 200,
            json: async () => data,
        })),
    },
}));

describe('Payment System', () => {
    test('POST /api/payments/create-intent creates intent for valid reservation', async () => {
        const req = new NextRequest('http://localhost/api/payments/create-intent', {
            method: 'POST',
            body: JSON.stringify({ reservationId: 'res123' })
        });

        const res = await createIntent(req as any);
        const data = await res.json();
        expect(res.status).toBe(200);
        expect(data.clientSecret).toBe('secret_123');
    });

    test('Webhook payment_intent.succeeded updates reservation', async () => {
        const req = new NextRequest('http://localhost/api/payments/webhook', {
            method: 'POST',
            body: JSON.stringify({
                type: 'payment_intent.succeeded',
                data: {
                    object: {
                        metadata: { reservationId: 'res123', email: 'test@example.com' }
                    }
                }
            })
        });

        const res = await handleWebhook(req as any);
        expect(res.status).toBe(200);
    });

    test('cancelExpiredReservations triggers cancels', async () => {
        const supabase = require('@/lib/supabase/server').createAdminClient();
        await cancelExpiredReservations(supabase);
        expect(supabase.from).toHaveBeenCalledWith('reservations');
    });
});
