import { sendEmail } from '@/lib/email/sendEmail';
import { transporter } from '@/lib/email/client';
import { GET as reviewCron } from '@/app/api/cron/review-emails/route';
import { NextRequest } from 'next/server';

// Mock nodemailer
jest.mock('@/lib/email/client', () => ({
    transporter: {
        sendMail: jest.fn().mockResolvedValue({ messageId: '123' })
    }
}));

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
    createAdminClient: jest.fn(() => ({
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        then: jest.fn().mockImplementation((cb) => Promise.resolve(cb({
            data: [{ id: 'res1', email: 'user@example.com', customer_name: 'Test' }],
            error: null
        })))
    }))
}));

// Mock next/server
jest.mock('next/server', () => ({
    NextRequest: jest.fn((url, init) => ({
        url,
        headers: { get: jest.fn().mockReturnValue(null) }
    })),
    NextResponse: {
        json: jest.fn((data, init) => ({
            status: init?.status || 200,
            json: async () => data,
        })),
    },
}));

describe('Email System', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('sendEmail template: reservation_confirmation calls sendMail', async () => {
        await sendEmail({
            to: 'test@example.com',
            template: 'reservation_confirmation',
            data: {
                customerName: 'John',
                date: '2026-05-05',
                time: '19:00',
                partySize: 2,
                tableIds: [1]
            }
        });

        expect(transporter.sendMail).toHaveBeenCalled();
        const args = (transporter.sendMail as jest.Mock).mock.calls[0][0];
        expect(args.to).toBe('test@example.com');
        expect(args.subject).toContain('2026-05-05');
    });

    test('sendEmail template: deposit_required contains payment link', async () => {
        await sendEmail({
            to: 'test@example.com',
            template: 'deposit_required',
            data: {
                reservationId: 'res123',
                customerName: 'John',
                date: '2026-05-05',
                time: '19:00',
                partySize: 10,
                expiryTime: '19:30'
            }
        });

        const args = (transporter.sendMail as jest.Mock).mock.calls[0][0];
        expect(args.html).toContain('/reserve/deposit?reservationId=res123');
        expect(args.html).toContain('19:30');
    });

    test('sendEmail handles failure gracefully', async () => {
        (transporter.sendMail as jest.Mock).mockRejectedValueOnce(new Error('SMTP failure'));

        // Should not throw
        await expect(sendEmail({
            to: 'fail@example.com',
            template: 'reservation_confirmation',
            data: {}
        } as any)).resolves.not.toThrow();
    });

    test('review-emails cron processes seated reservations', async () => {
        const req = new NextRequest('http://localhost/api/cron/review-emails');
        const res = await reviewCron(req as any);
        const data = await res.json();

        expect(data.processed).toBe(1);
        expect(transporter.sendMail).toHaveBeenCalled();
    });
});
