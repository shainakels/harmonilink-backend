const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').escape(),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, rememberMe } = req.body;

  if (!email || !password) {
    return res.status(422).json({ message: 'Email and password are required.' });
  }

  try {
    const [user] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (user.length === 0) {
      return res.status(404).json({ message: 'User not registered.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user[0].password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const tokenExpiry = rememberMe ? '30d' : '1h';
    const maxAgeMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000;

    const token = jwt.sign({ id: user[0].id }, process.env.JWT_SECRET, { expiresIn: tokenExpiry });

    res.cookie('token', token, {
      httpOnly: true,
      secure: true, // Make sure your app is running on HTTPS in production
      sameSite: 'Strict', // or 'Lax' if needed
      maxAge: maxAgeMs,
    });

    res.status(200).json({
      message: 'Login successful',
      token, // <-- Add this line
      user_id: user[0].id,
      onboarding_completed: user[0].onboarding_completed
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
