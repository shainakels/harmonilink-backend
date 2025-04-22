const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Database connection

// Save mixtape
router.post('/pfmixtape', async (req, res) => {
  const { user_id, name, bio, photo_url, songs } = req.body;

  try {
    // Insert mixtape into the mixtapes table
    const [result] = await db.query(
      'INSERT INTO mixtapes (user_id, name, bio, photo_url) VALUES (?, ?, ?, ?)',
      [user_id, name, bio, photo_url]
    );

    const mixtape_id = result.insertId;

    // Insert songs into the mixtape_songs table
    for (const song of songs) {
      await db.query(
        'INSERT INTO mixtape_songs (mixtape_id, song_name, artist_name) VALUES (?, ?, ?)',
        [mixtape_id, song.name, song.artist]
      );
    }

    res.status(201).json({ status: 'success', message: 'Mixtape created successfully!' });
  } catch (error) {
    console.error('Error saving mixtape:', error);
    res.status(500).json({ status: 'error', message: 'Failed to save mixtape.' });
  }
});

module.exports = router;