const express = require('express');
const { fetchGamesByDate } = require('../api/games.api');

const router = express.Router();

router.get('/api/games/by-date', async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        error: 'Nedostaje query parametar "date". Primjer: /api/games/by-date?date=2025-04-15'
      });
    }

    const data = await fetchGamesByDate(date);
    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

module.exports = router;