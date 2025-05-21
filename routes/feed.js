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
router.post('/feed', authenticateToken, async (req, res) => {
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

// Fetch all polls with options and vote counts
router.get('/feed', authenticateToken, async (req, res) => {
  try {
    // Get polls with user info
    const [polls] = await db.execute(
      `SELECT polls.id AS poll_id, polls.question, polls.user_id, users.username, users.gender, users.birthday
       FROM polls
       JOIN users ON polls.user_id = users.id
       ORDER BY polls.id DESC`
    );

    // For each poll, get its options and vote counts
    const pollIds = polls.map(p => p.poll_id);
    let pollOptions = [];
    if (pollIds.length > 0) {
      const [options] = await db.query(
        `SELECT poll_options.id, poll_options.poll_id, poll_options.option_text,
                COUNT(poll_votes.id) AS votes
         FROM poll_options
         LEFT JOIN poll_votes ON poll_options.id = poll_votes.option_id
         WHERE poll_options.poll_id IN (?)
         GROUP BY poll_options.id`,
        [pollIds]
      );
      pollOptions = options;
    }

    // Assemble polls with options
    const result = polls.map(poll => ({
      id: poll.poll_id,
      question: poll.question,
      user: {
        id: poll.user_id,
        name: poll.username,
        gender: poll.gender,
        // Add age calculation if needed
      },
      options: pollOptions
        .filter(opt => opt.poll_id === poll.poll_id)
        .map(opt => ({
          id: opt.id,
          text: opt.option_text,
          votes: Number(opt.votes)
        }))
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching polls:', error);
    res.status(500).json({ message: 'Failed to fetch polls.' });
  }
});

module.exports = router;