export const baseLayout = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      background-color: #FAF7F2;
      font-family: 'Georgia', serif;
      margin: 0;
      padding: 0;
      color: #333;
    }
    .wrapper {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-top: 8px solid #8B1A1A;
      box-shadow: 0 4px 10px rgba(0,0,0,0.05);
    }
    .header {
      padding: 30px;
      text-align: center;
      background-color: #8B1A1A;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 28px;
      letter-spacing: 2px;
    }
    .header p {
      color: #C4973A;
      margin: 5px 0 0;
      font-size: 12px;
      letter-spacing: 4px;
      text-transform: uppercase;
    }
    .content {
      padding: 40px 30px;
      line-height: 1.6;
    }
    .content h2 {
      color: #8B1A1A;
      margin-top: 0;
    }
    .divider {
      height: 2px;
      background-color: #C4973A;
      margin: 30px 0;
      width: 60px;
    }
    .footer {
      padding: 30px;
      text-align: center;
      font-size: 12px;
      color: #999;
      background-color: #fcfcfc;
      border-top: 1px solid #eee;
    }
    .btn {
      display: inline-block;
      padding: 14px 28px;
      background-color: #8B1A1A;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 4px;
      font-weight: bold;
      margin: 20px 0;
    }
    .summary {
      background-color: #FAF7F2;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .summary p {
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>DIBA</h1>
      <p>Persian Cuisine</p>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>6520 Somerled Ave, Montreal</p>
      <p>(514) 485-9999</p>
      <p>&copy; ${new Date().getFullYear()} Diba Restaurant. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;
