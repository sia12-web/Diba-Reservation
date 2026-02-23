import { baseLayout } from './baseLayout';

export const depositConfirmationTemplate = (data: {
    customerName: string;
    date: string;
    time: string;
    partySize: number;
    tableIds: number[];
}) => {
    const subject = `Reservation confirmed — Diba Restaurant, ${data.date} at ${data.time}`;
    const html = baseLayout(`
    <h2>Your Deposit has been Received</h2>
    <p>Salam ${data.customerName}, your reservation is now confirmed! We have successfully received your $50 deposit.</p>
    
    <div class="divider"></div>
    
    <div class="summary">
      <p><strong>Booking Details:</strong></p>
      <p><strong>Date:</strong> ${data.date}</p>
      <p><strong>Time:</strong> ${data.time}</p>
      <p><strong>Guests:</strong> ${data.partySize}</p>
      <p><strong>Table:</strong> ${data.tableIds.join(', ')}</p>
    </div>
    
    <p style="font-weight: bold; color: #8B1A1A;">Your $50 deposit will be applied to your bill on the day of your visit.</p>
    
    <p>We look forward to serving you soon!</p>
    
    <div class="divider"></div>
    <p style="font-size: 11px; color: #999;">If you need to cancel, please notify us at least 24 hours in advance to receive a refund of your deposit.</p>
  `);

    return { subject, html };
};
