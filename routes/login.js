const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Get user with verification status
    const [users] = await db.query(
      'SELECT id, email, password, email_verified FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        message: 'User not registered. Please sign up first.' 
      });
    }

    const user = users[0];
    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      return res.status(400).json({ 
        message: 'Invalid email or password.' 
      });
    }

    // Check email verification
    if (!user.email_verified) {
      return res.status(403).json({
        status: 'unverified',
        message: 'Please verify your email address to continue.',
        email: user.email
      });
    }

    // Generate JWT token only if email is verified
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'An error occurred during login.' });
  }
});

module.exports = router;
