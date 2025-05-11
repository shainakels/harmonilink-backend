const express = require('express');
const router = express.Router();
const db = require('../config/db'); 
const crypto = require('crypto');
const nodemailer = require('nodemailer');

router.post('/', async (req, res) => {
  const { email } = req.body;

  try {
    const [user] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (user.length === 0) {
      return res.status(404).json({ message: 'Email not found.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; 

    await db.query('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?', [
      resetToken,
      resetTokenExpiry,
      email,
    ]);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'harmonilinkweb@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD, 
      },
    });    

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await transporter.sendMail({
      from: `"Harmonilink Team" <harmonilinkweb@gmail.com>`,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9f9f9; color: #333;">
          <div style="max-width: 600px; margin: 20px auto; padding: 20px; background-color: #ffffff; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="text-align: center; color: #4CAF50;">Harmonilink Password Reset</h2>
            <p style="font-size: 16px;">Hello,</p>
            <p style="font-size: 16px;">You recently requested to reset your Harmonilink account password. Click the button below to set a new password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">Reset Password</a>
            </div>
            
            <p style="font-size: 16px;">If the button above doesn’t work, you can also reset your password using this link:</p>
            <p style="word-break: break-word; font-size: 14px; text-align: center;"><a href="${resetLink}" style="color: #1a73e8;">${resetLink}</a></p>
            
            <p style="font-size: 16px;">This link will expire in 1 hour. If you did not request a password reset, please ignore this message—your password will remain unchanged.</p>
            
            <p style="font-size: 16px;">Thank you,<br><strong>The Harmonilink Team</strong></p>
            
            <hr style="margin: 40px 0; border: none; border-top: 1px solid #ddd;" />
            <p style="font-size: 12px; color: #888888; text-align: center;">
              Need help? Contact us at <a href="mailto:support@harmonilink.com" style="color: #888888;">support@harmonilink.com</a>
            </p>
          </div>
        </body>
        </html>
      `,
      headers: {
        'Content-Type': 'text/html', 
      }
    });
    
    res.status(200).json({ message: 'Password reset link sent to your email.' });
  } catch (error) {
    console.error('Error in forgot-password:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;