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

// Create a new mixtape
router.post('/create-mixtape', authenticateToken, async (req, res) => {
  const { name, description, photoUrl, songs } = req.body;

  if (!name || !songs || songs.length === 0) {
    return res.status(400).json({ message: 'Mixtape name and at least one song are required.' });
  }

  try {
    const [result] = await db.execute(
      'INSERT INTO mixtapes (user_id, name, bio, photo_url) VALUES (?, ?, ?, ?)',
      [req.user.id, name, description, photoUrl]
    );

    const mixtapeId = result.insertId;

    const songInserts = songs.map(song =>
      db.execute(
        'INSERT INTO mixtape_songs (mixtape_id, song_name, artist_name) VALUES (?, ?, ?)',
        [mixtapeId, song.name, song.artist]
      )
    );

    await Promise.all(songInserts);

    res.status(201).json({ message: 'Mixtape created successfully.' });
  } catch (error) {
    console.error('Error creating mixtape:', error);
    res.status(500).json({ message: 'Failed to create mixtape.' });
  }
});

// Fetch all mixtapes for the logged-in user
router.get('/mixtapes', authenticateToken, async (req, res) => {
  try {
    const [mixtapes] = await db.execute(
      `
      SELECT 
        m.id AS mixtape_id,
        m.name,
        m.bio,
        m.photo_url,
        GROUP_CONCAT(s.song_name) AS song_names,
        GROUP_CONCAT(s.artist_name) AS artist_names
      FROM mixtapes m
      LEFT JOIN mixtape_songs s ON m.id = s.mixtape_id
      WHERE m.user_id = ?
      GROUP BY m.id
      `,
      [req.user.id]
    );

    const formattedMixtapes = mixtapes.map(mixtape => ({
      id: mixtape.mixtape_id,
      name: mixtape.name,
      bio: mixtape.bio,
      photo_url: mixtape.photo_url,
      songs: mixtape.song_names
        ? mixtape.song_names.split(',').map((songName, index) => ({
            name: songName,
            artist: mixtape.artist_names.split(',')[index],
          }))
        : [],
    }));

    res.status(200).json(formattedMixtapes);
  } catch (error) {
    console.error('Error fetching mixtapes:', error);
    res.status(500).json({ message: 'Failed to fetch mixtapes.' });
  }
});

module.exports = router;