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

// Discover endpoint
router.get('/discover', authenticateToken, async (req, res) => {
  try {
    // Fetch profiles excluding the logged-in user
    const [profiles] = await db.query(`
      SELECT 
        users.username,
        user_profiles.gender,
        user_profiles.bio AS profile_bio,
        user_profiles.birthday,
        user_profiles.user_id
      FROM user_profiles
      INNER JOIN users ON user_profiles.user_id = users.id
      WHERE users.id != ?
    `, [req.user.id]);

    // Calculate age and fetch mixtapes for each profile
    const profileWithDetails = await Promise.all(
      profiles.map(async (profile) => {
        const age = profile.birthday
          ? Math.floor((new Date() - new Date(profile.birthday)) / (365.25 * 24 * 60 * 60 * 1000))
          : null;

        // Fetch mixtape details for the user
        const [mixtapes] = await db.query(`
          SELECT id AS mixtape_id, name, bio AS mixtape_bio, photo_url
          FROM mixtapes
          WHERE user_id = ?
        `, [profile.user_id]);

        // Fetch songs for each mixtape
        const mixtapesWithSongs = await Promise.all(
          mixtapes.map(async (mixtape) => {
            const [songs] = await db.query(`
              SELECT song_name, artist_name
              FROM mixtape_songs
              WHERE mixtape_id = ?
            `, [mixtape.mixtape_id]);

            return {
              ...mixtape,
              songs,
            };
          })
        );

        return {
          ...profile,
          age,
          mixtapes: mixtapesWithSongs,
        };
      })
    );

    console.log('Profiles with mixtapes:', JSON.stringify(profileWithDetails, null, 2)); // Log full details
    res.json(profileWithDetails);
  } catch (error) {
    console.error('Error fetching profiles and mixtapes:', error);
    res.status(500).json({ message: 'Failed to fetch profiles and mixtapes.' });
  }
});

module.exports = router;