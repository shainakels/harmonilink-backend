const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db'); 
const { body, validationResult } = require('express-validator');
const axios = require('axios');

router.post('/signup', [
  body('username').trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).escape(),
], async (req, res) => {
  const { username, email, password, recaptchaResponse } = req.body;

  // Verify reCAPTCHA
  const secretKey = '6LeSaTIrAAAAALLD-cSjuLjZqKZnfifJl_RedkF6'; // Replace with your secret key
  const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaResponse}`;

  try {
    const { data } = await axios.post(verificationUrl);
    if (!data.success) {
      return res.status(400).json({ message: 'reCAPTCHA verification failed.' });
    }

    // Check if username or email already exists
    const [existingUser] = await db.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser.length > 0) {
      return res.status(422).json({
        message: 'Username or email is already taken.',
        errors: {
          username: existingUser.some(user => user.username === username) ? 'Username is already taken.' : null,
          email: existingUser.some(user => user.email === email) ? 'Email is already registered.' : null,
        },
      });
    }

    // Hash the password and save the user
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [
      username,
      email,
      hashedPassword,
    ]);

    res.status(201).json({ message: 'Signup successful!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred during signup.' });
  }
});

module.exports = router;
