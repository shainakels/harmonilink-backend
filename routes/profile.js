const express = require('express');
const router = express.Router();
const db = require('../config/db'); 
const authenticateToken = require('../middleware/authenticateToken'); 

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

router.get('/profile', authenticateToken, async (req, res) => {
  const user_id = req.user.id;

  try {
    const [profile] = await db.query('SELECT * FROM user_profiles WHERE user_id = ?', [user_id]);
    if (profile.length === 0) {
      return res.status(404).json({ message: 'Profile not found.' });
    }
    res.status(200).json({ profile: profile[0] });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

router.post('/complete-onboarding', async (req, res) => {
  const { user_id } = req.body;

  try {
    await db.query('UPDATE users SET onboarding_completed = TRUE WHERE id = ?', [user_id]);
    res.status(200).json({ message: 'Onboarding completed.' });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;