export const tableUpdateTemplate = (data: { customerName: string, date: string, time: string, newTables: number[] }) => ({
    subject: `Your table at Diba has been updated`,
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
            <h2>Your table assignment has been updated</h2>
            <p>Dear ${data.customerName},</p>
            <p>We are writing to inform you that we have updated your table assignment for your reservation on <strong>${data.date}</strong> at <strong>${data.time}</strong>.</p>
            <p>Please accept our apologies for any confusion. Your reservation is now assigned to <strong>Table(s) ${data.newTables.join(', ')}</strong>. </p>
            <p><strong>Please note:</strong> Your reservation time and all other details remain exactly the same. We look forward to welcoming you!</p>
            <p>If you have any questions, feel free to call us at (514) 485-9999.</p>
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
