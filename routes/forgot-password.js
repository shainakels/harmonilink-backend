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
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS, 
      },
    });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await transporter.sendMail({
      from: `"Harmonilink Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <p>You requested a password reset for your Harmonilink account. Click the link below to reset your password:</p>
        <p><a href="${resetLink}" style="color: #1a73e8; text-decoration: none;">Reset Password</a></p>
        <p>If you did not request this, please ignore this email. Your password will remain unchanged.</p>
        <p>Thank you,<br>The Harmonilink Team</p>
      `,
    }, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
      } else {
        console.log('Email sent successfully:', info.response);
      }
    });

    res.status(200).json({ message: 'Password reset link sent to your email.' });
  } catch (error) {
    console.error('Error in forgot-password:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;