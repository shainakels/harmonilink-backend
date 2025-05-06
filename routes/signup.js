const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db'); 
const { body, validationResult } = require('express-validator');

const validatePasswordStrength = (password) => {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(password);
};

router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  try {
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

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    res.status(201).json({
      message: 'User registered successfully',
      user_id: result.insertId,
      onboarding_completed: false, 
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
