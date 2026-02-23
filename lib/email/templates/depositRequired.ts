import { baseLayout } from './baseLayout';

export const depositRequiredTemplate = (data: {
    reservationId: string;
    customerName: string;
    date: string;
    time: string;
    partySize: number;
    expiryTime: string;
}) => {
    const subject = 'Complete your reservation at Diba — $50 deposit required';
    const paymentLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/reserve/deposit?reservationId=${data.reservationId}`;

    const html = baseLayout(`
    <h2>Action Required: Secure Your Table</h2>
    <p>Salam ${data.customerName}, to confirm your reservation for a party of ${data.partySize}, a $50 CAD deposit is required.</p>
    
    <div class="summary">
      <p><strong>Reservation Summary:</strong></p>
      <p>${data.date} at ${data.time}</p>
      <p>${data.partySize} Guests</p>
    </div>
    
    <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; border: 1px solid #ffeeba; color: #856404; margin-bottom: 20px;">
      <p style="margin: 0; font-weight: bold;">Important Notice:</p>
      <p style="margin: 5px 0 0;">Your table is currently held, but will be released if the deposit is not paid by <strong>${data.expiryTime}</strong> (30 minutes from booking).</p>
    </div>
    
    <p>Click the button below to complete your payment via Stripe. This $50 deposit will be applied to your final bill.</p>
    
    <a href="${paymentLink}" class="btn">Pay $50 Deposit Now</a>
    
    <p>If you have any questions, please contact us at (514) 485-9999.</p>
  `);

    return { subject, html };
};
