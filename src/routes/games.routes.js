const express = require('express');
const { fetchGamesByDate } = require('../api/games.api');
const { fetchLeagueGames } = require('../api/leagueGameFinder.api');
const { insertGame, getAllGames, deleteGame, getGamesByFilters } = require('../supabase/games.db');

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







router.get('/api/games/league-game-finder', async (req, res) => {
  try {
    const {
      season = '2024-25',
      seasonType = 'Regular Season',
      dateFrom = '',
      dateTo = ''
    } = req.query;

    const data = await fetchLeagueGames({
      season,
      seasonType,
      dateFrom,
      dateTo
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

router.get('/api/games/db', async (req, res) => {
  try {
    const data = await getAllGames();
    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

router.post('/api/games/db', async (req, res) => {
  try {
    const inserted = await insertGame(req.body);
    res.json(inserted);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

router.delete('/api/games/db/:id', async (req, res) => {
  try {
    const deleted = await deleteGame(req.params.id);
    res.json(deleted);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});



router.get('/api/games/db/search', async (req, res) => {
  try {
    const {
      gameType = '',
      dateFrom = '',
      dateTo = '',
      team = ''
    } = req.query;

    const data = await getGamesByFilters({
      gameType,
      dateFrom,
      dateTo,
      team
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

module.exports = router;