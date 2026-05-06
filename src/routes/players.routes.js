const express = require('express');
const { fetchPlayersBySeason } = require('../api/players.api');
const { fetchPlayerInfo } = require('../api/playerInfo.api');
const { insertPlayer, getAllPlayers, updatePlayer } = require('../supabase/players.db');
const { fetchPlayerGameLog } = require('../api/playerGameLog.api');
const {insertPlayerTeamHistory, deletePlayerTeamHistory, getPlayerTeamHistory} = require('../supabase/playerTeamHistory.db');

const router = express.Router();

router.get('/api/players', async (req, res) => {
  try {
    const { season = '2024-25', current = '0' } = req.query;

    const data = await fetchPlayersBySeason(season, current);

    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

router.get('/api/player-info', async (req, res) => {
  try {
    const { playerId } = req.query;

    if (!playerId) {
      return res.status(400).json({
        error: 'Nedostaje query parametar "playerId". Primjer: /api/player-info?playerId=1630173'
      });
    }

    const data = await fetchPlayerInfo(playerId);
    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

router.get('/api/players/db', async (req, res) => {
  try {
    const data = await getAllPlayers();
    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

router.post('/api/players/db', async (req, res) => {
  try {
    const {
      player_id,
      first_name,
      last_name,
      birthdate,
      roster_status,
      team_id,
      team_abbreviation
    } = req.body;

    const inserted = await insertPlayer({
      player_id,
      first_name,
      last_name,
      birthdate,
      roster_status,
      team_id,
      team_abbreviation
    });

    res.json(inserted);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

router.put('/api/players/db/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const {
      player_id,
      first_name,
      last_name,
      birthdate,
      roster_status,
      team_id,
      team_abbreviation
    } = req.body;

    const updated = await updatePlayer(id, {
      player_id,
      first_name,
      last_name,
      birthdate,
      roster_status,
      team_id,
      team_abbreviation
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});





router.get('/api/player-gamelog', async (req, res) => {
  try {
    const { playerId, season } = req.query;

    if (!playerId || !season) {
      return res.status(400).json({
        error: 'Nedostaje playerId ili season. Primjer: /api/player-gamelog?playerId=1629029&season=2025-26'
      });
    }

    const data = await fetchPlayerGameLog(playerId, season);
    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

router.post('/api/player-history/save/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    const historyRows = req.body;

    if (!Array.isArray(historyRows)) {
      return res.status(400).json({
        error: 'Body mora biti array history redova.'
      });
    }

    await deletePlayerTeamHistory(playerId);

    const insertedRows = [];

    for (const row of historyRows) {
      const inserted = await insertPlayerTeamHistory(row);
      insertedRows.push(...inserted);
    }

    res.json(insertedRows);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});





router.get('/api/player-history/:playerId', async (req, res) => {
  try {
    const data = await getPlayerTeamHistory(req.params.playerId);
    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

module.exports = router;