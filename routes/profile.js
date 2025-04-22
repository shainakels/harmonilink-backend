const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Database connection

// Save user profile
router.post('/pfcustom', async (req, res) => {
  const { user_id, birthday, gender, bio } = req.body;

  try {
    await db.query(
      'INSERT INTO user_profiles (user_id, birthday, gender, bio) VALUES (?, ?, ?, ?)',
      [user_id, birthday, gender, bio]
    );
    res.status(201).json({ status: 'success', message: 'Profile saved successfully!' });
  } catch (error) {
    console.error('Error saving profile:', error);
    res.status(500).json({ status: 'error', message: 'Failed to save profile.' });
  }
});

module.exports = router;