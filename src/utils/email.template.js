export const forgetpassword = (otp) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      background-color: #f3f4f6;
    }
    .container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background-color: #f3f4f6;
    }
    .card {
      background-color: #ffffff;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      width: 100%;
      max-width: 600px;
      padding: 30px;
      text-align: center;
    }
    h2 {
      font-size: 24px;
      color: #333333;
    }
    .otp {
      font-size: 32px;
      font-weight: bold;
      color: #1d4ed8;
      margin: 20px 0;
    }
    p {
      font-size: 14px;
      color: #555555;
    }
    .footer {
      font-size: 12px;
      color: #bbbbbb;
    }
  </style>
</head>
<body>

  <div class="container">
    <div class="card">
      <h2>Password Reset Request</h2>
      <p>We received a request to reset your password. Please use the following one-time password (OTP) to complete the process.</p>
      
      <div class="otp">${otp}</div>
      
      <p>This OTP will expire in 10 minutes. If you did not request a password reset, please disregard this email.</p>
      <p>To reset your password, enter the OTP on the password reset page.</p>

      <div class="footer">
        <p>&copy; 2025 Urgent-Hai. All rights reserved.</p>
      </div>
    </div>
  </div>

</body>
</html>
`;

export const verifyAccount = (otp) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Verification</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      background-color: #f3f4f6;
    }
    .container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background-color: #f3f4f6;
    }
    .card {
      background-color: #ffffff;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      width: 100%;
      max-width: 600px;
      padding: 30px;
      text-align: center;
    }
    h2 {
      font-size: 24px;
      color: #333333;
    }
    .otp {
      font-size: 32px;
      font-weight: bold;
      color: #1d4ed8;
      margin: 20px 0;
    }
    p {
      font-size: 14px;
      color: #555555;
    }
    .footer {
      font-size: 12px;
      color: #bbbbbb;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h2>Verify Your Account</h2>
      <p>Thank you for registering with us! Please use the following one-time password (OTP) to verify your account.</p>
      
      <div class="otp">${otp}</div>
      
      <p>This OTP will expire in 10 minutes. If you did not create an account, please disregard this email.</p>
      <p>To verify your account, enter the OTP on the account verification page.</p>

      <div class="footer">
        <p>© 2025 Urgent-Hai. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;
