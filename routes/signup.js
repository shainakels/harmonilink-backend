const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db'); // your DB connection
const { body, validationResult } = require('express-validator');

router.post(
  '/signup',
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.mapped() });
    }

    const { username, email, password } = req.body;

    try {
      const [existingUser] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      if (existingUser.length > 0) {
        return res.status(422).json({ errors: { email: { msg: 'Email is already registered' } } });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await db.query(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hashedPassword]
      );

      res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
      console.error('Signup error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;
