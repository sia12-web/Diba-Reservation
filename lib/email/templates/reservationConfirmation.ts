import { baseLayout } from './baseLayout';

export const reservationConfirmationTemplate = (data: {
    customerName: string;
    date: string;
    time: string;
    partySize: number;
    tableIds: number[];
}) => {
    const subject = `Your reservation at Diba is confirmed — ${data.date} at ${data.time}`;
    const html = baseLayout(`
    <h2>Salam, ${data.customerName}!</h2>
    <p>Your reservation at Diba is confirmed. We look forward to welcoming you for an authentic Persian dining experience.</p>
    
    <div class="divider"></div>
    
    <div class="summary">
      <p><strong>Date:</strong> ${data.date}</p>
      <p><strong>Time:</strong> ${data.time}</p>
      <p><strong>Guests:</strong> ${data.partySize}</p>
      <p><strong>Table:</strong> ${data.tableIds.join(', ')}</p>
    </div>
    
    <p>If you need to change or cancel your reservation, please call us at (514) 485-9999.</p>
    
    <p>See you soon!</p>
    <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}" class="btn">Visit Our Website</a>
  `);

    return { subject, html };
};
