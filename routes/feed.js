const express = require('express');
const router = express.Router();
const db = require('../config/db');
const jwt = require('jsonwebtoken');

// Middleware to verify JWT
function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access token required.' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token.' });
    req.user = user; // Attach user info to the request
    next();
  });
}

// Create Poll Endpoint
router.post('/create-poll', authenticateToken, async (req, res) => {
  const { question, options } = req.body;

  if (!question || !options || options.length < 2) {
    return res.status(400).json({ message: 'Poll question and at least two options are required.' });
  }

  try {
    // Insert poll into the database
    const [pollResult] = await db.execute(
      'INSERT INTO polls (user_id, question) VALUES (?, ?)',
      [req.user.id, question]
    );

    const pollId = pollResult.insertId;

    // Insert poll options into the database
    const optionPromises = options.map(option =>
      db.execute('INSERT INTO poll_options (poll_id, option_text) VALUES (?, ?)', [pollId, option])
    );
    await Promise.all(optionPromises);

    res.status(201).json({ message: 'Poll created successfully.', pollId });
  } catch (error) {
    console.error('Error creating poll:', error);
    res.status(500).json({ message: 'Failed to create poll.' });
  }
});

module.exports = router;