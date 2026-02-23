import { transporter } from './client';
import { reservationConfirmationTemplate } from './templates/reservationConfirmation';
import { depositRequiredTemplate } from './templates/depositRequired';
import { depositConfirmationTemplate } from './templates/depositConfirmation';
import { reviewRequestTemplate } from './templates/reviewRequest';

interface EmailPayload {
    to: string;
    template: 'reservation_confirmation' | 'deposit_required' | 'deposit_confirmation' | 'review_request';
    data: Record<string, any>;
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
    try {
        let subject = '';
        let html = '';

        switch (payload.template) {
            case 'reservation_confirmation':
                ({ subject, html } = reservationConfirmationTemplate(payload.data as any));
                break;
            case 'deposit_required':
                ({ subject, html } = depositRequiredTemplate(payload.data as any));
                break;
            case 'deposit_confirmation':
                ({ subject, html } = depositConfirmationTemplate(payload.data as any));
                break;
            case 'review_request':
                ({ subject, html } = reviewRequestTemplate(payload.data as any));
                break;
            default:
                throw new Error(`Invalid template: ${payload.template}`);
        }

        await transporter.sendMail({
            from: process.env.SMTP_FROM || '"Diba Restaurant" <reservations@dibarestaurant.ca>',
            to: payload.to,
            subject,
            html,
        });

        console.log(`Email sent: ${payload.template} to ${payload.to}`);
    } catch (error) {
        console.error(`Failed to send email (${payload.template}):`, error);
        // Email failure must never break the reservation flow
    }
}
