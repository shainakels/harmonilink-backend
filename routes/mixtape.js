const express = require('express');
const router = express.Router();
const db = require('../config/db'); 

router.post('/pfmixtape', async (req, res) => {
  const { user_id, name, bio, photo_url, songs } = req.body;

  if (!user_id || !name || !bio || !photo_url || !songs || songs.length < 3) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid data. All fields are required, and at least 3 songs must be provided.',
    });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      'INSERT INTO mixtapes (user_id, name, bio, photo_url) VALUES (?, ?, ?, ?)',
      [user_id, name, bio, photo_url]
    );

    const mixtape_id = result.insertId;

    for (const song of songs) {
      if (!song.name || !song.artist) {
        throw new Error('Each song must have a name and an artist.');
      }

      await connection.query(
        'INSERT INTO mixtape_songs (mixtape_id, song_name, artist_name) VALUES (?, ?, ?)',
        [mixtape_id, song.name, song.artist]
      );
    }

    await connection.commit();
    res.status(201).json({ status: 'success', message: 'Mixtape created successfully!' });
  } catch (error) {
    await connection.rollback();
    console.error('Error saving mixtape:', error);
    res.status(500).json({ status: 'error', message: 'Failed to save mixtape.' });
  } finally {
    connection.release();
  }
});

module.exports = router;