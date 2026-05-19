const express = require('express');

const {
  fetchBoxScoreTraditionalV2
} = require('../api/boxScoreTraditionalV2.api');

const {
  insertPlayerGameStats, getImportedPlayerGameStatsGameIds
} = require('../supabase/playerGameStats.db');

const router = express.Router();

router.get('/api/player-game-stats/boxscore', async (req, res) => {
  try {
    const { gameId } = req.query;

    if (!gameId) {
      return res.status(400).json({
        error: 'Nedostaje query parametar "gameId".'
      });
    }

    const data = await fetchBoxScoreTraditionalV2(gameId);

    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

router.post('/api/player-game-stats/import', async (req, res) => {
  try {
    const { rows } = req.body;

    if (!Array.isArray(rows) || !rows.length) {
      return res.status(400).json({
        error: 'Rows array je obavezan.'
      });
    }

    const data = await insertPlayerGameStats(rows);

    res.json({
      inserted: data.length,
      data
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

router.get('/api/player-game-stats/imported-game-ids', async (req, res) => {
  try {
    const gameIds = await getImportedPlayerGameStatsGameIds();

    res.json({
      gameIds
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

module.exports = router;