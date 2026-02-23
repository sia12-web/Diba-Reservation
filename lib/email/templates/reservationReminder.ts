export const reservationReminderTemplate = (data: { customerName: string, date: string, time: string, partySize: number, tableIds: number[] }) => ({
    subject: `See you tomorrow at Diba — ${data.time} reservation confirmed`,
    html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Georgia', serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #FAF7F2; }
        .header { text-align: center; background-color: #8B1A1A; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; background-color: #FAF7F2; border-radius: 0 0 8px 8px; }
        .footer { text-align: center; margin-top: 20px; font-size: 0.8em; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>DIBA</h1>
            <p style="letter-spacing: 0.2em; text-transform: uppercase; font-size: 0.8em;">Persian Cuisine</p>
        </div>
        <div class="content">
            <h2>See you tomorrow at Diba!</h2>
            <p>Dear ${data.customerName},</p>
            <p>This is a friendly reminder of your reservation for tomorrow, <strong>${data.date}</strong> at <strong>${data.time}</strong>.</p>
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Party Size:</strong> ${data.partySize} guests</p>
                <p style="margin: 5px 0;"><strong>Table(s):</strong> ${data.tableIds.join(', ')}</p>
            </div>
            <p>If your plans have changed and you need to cancel or modify your reservation, please let us know as soon as possible by calling us at <strong>(514) 485-9999</strong>.</p>
            <p>We look forward to serving you!</p>
            <br>
            <p>Warmly,<br>The Diba Team</p>
        </div>
        <div class="footer">
            <p>1234 Somerled Ave, Montreal, QC H4V 1R1</p>
        </div>
    </div>
</body>
</html>
`
});
