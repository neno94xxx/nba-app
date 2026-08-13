const express = require('express');

const {
  fetchPlayerGameStats
} = require('../api/playerGameStats.api');

const {
  savePlayerGameStats,
  getImportedPlayerGameStatsGameIds,
  getPlayerGameStatsSummariesByName
} = require('../supabase/playerGameStats.db');

const router = express.Router();

router.get('/api/player-game-stats/summary', async (req, res) => {
  try {
    const name = String(req.query.name || '').trim();

    if (!name) {
      return res.status(400).json({
        error: 'Nedostaje query parametar "name".'
      });
    }

    const data = await getPlayerGameStatsSummariesByName(name);

    res.json({
      query: name,
      count: data.length,
      data
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

router.get('/api/player-game-stats/boxscore', async (req, res) => {
  try {
    const { gameId } = req.query;

    if (!gameId) {
      return res.status(400).json({
        error: 'Nedostaje query parametar "gameId".'
      });
    }

    const data = await fetchPlayerGameStats(String(gameId).trim());

    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

router.post('/api/player-game-stats/import', async (req, res) => {
  try {
    const gameId = String(req.body.gameId || '').trim();

    if (!gameId) {
      return res.status(400).json({
        error: 'Game ID je obavezan.'
      });
    }

    const { source, rows } = await fetchPlayerGameStats(gameId);
    const result = await savePlayerGameStats(rows);

    res.json({
      imported: true,
      source,
      ...result
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
