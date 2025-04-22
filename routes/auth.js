const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db'); // assume you're using mysql2 or mysql
const { body, validationResult } = require('express-validator');

// Signup route
router.post('/signup', [
  body('name').notEmpty().withMessage('Username is required'),
  body('email').isEmail().withMessage('Invalid email format'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.mapped() });

  const { name, email, password } = req.body;

  try {
    // check if user exists
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(422).json({ errors: { email: ['Email already registered'] } });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword]);

    res.json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
