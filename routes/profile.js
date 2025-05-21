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
    const [profileRows] = await db.query(
      `SELECT 
          u.username AS name, 
          u.id AS user_id, 
          up.gender, 
          up.bio, 
          up.profile_image, 
          up.birthday,
          TIMESTAMPDIFF(YEAR, up.birthday, CURDATE()) AS age
        FROM users u
        JOIN user_profiles up ON u.id = up.user_id
        WHERE u.id = ?`,
      [user_id]
    );
    if (profileRows.length === 0) {
      return res.status(404).json({ message: 'Profile not found.' });
    }
    res.status(200).json({ profile: profileRows[0] });
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

// Update user profile (username, birthday, gender, bio, profile image)
router.put('/profile', authenticateToken, async (req, res) => {
  const user_id = req.user.id;
  const { name, gender, bio, profile_image } = req.body;

  try {
    // Update username in users table
    await db.query('UPDATE users SET username = ? WHERE id = ?', [name, user_id]);
    // Update profile info in user_profiles table (do NOT update birthday)
    await db.query(
      'UPDATE user_profiles SET gender = ?, bio = ?, profile_image = ? WHERE user_id = ?',
      [gender, bio, profile_image, user_id]
    );
    res.status(200).json({ message: 'Profile updated successfully.' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Failed to update profile.' });
  }
});

router.get('/mixtapes', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    // Fetch mixtapes for the user
    const [mixtapes] = await db.query(
      `SELECT id, name, bio AS description, photo_url AS cover
       FROM mixtapes
       WHERE user_id = ?
       ORDER BY id DESC`,
      [userId]
    );

    // Fetch songs for all mixtapes
    const mixtapeIds = mixtapes.map(m => m.id);
    let songs = [];
    if (mixtapeIds.length > 0) {
      const [songRows] = await db.query(
        `SELECT mixtape_id, song_name AS name, artist_name AS artist, preview_url AS url
         FROM mixtape_songs
         WHERE mixtape_id IN (?)`,
        [mixtapeIds]
      );
      songs = songRows;
    }

    // Attach songs to mixtapes
    const mixtapesWithSongs = mixtapes.map(mix => ({
      ...mix,
      songs: songs.filter(song => song.mixtape_id === mix.id)
    }));

    res.json(mixtapesWithSongs);
  } catch (error) {
    console.error('Error fetching mixtapes:', error);
    res.status(500).json({ message: 'Failed to fetch mixtapes.' });
  }
});

module.exports = router;