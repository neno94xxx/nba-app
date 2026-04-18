const express = require('express');
const { fetchTeams } = require('../api/teams.api');
const { insertTeam, getAllTeams, updateTeam  } = require('../supabase/teams.db');

const router = express.Router();

router.get('/api/teams', async (req, res) => {
  try {
    const data = await fetchTeams();
    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});


router.post('/api/teams', async (req, res) => {
  try {
    const {
      team_id,
      abbreviation,
      city,
      nickname,
      full_name,
      conference
    } = req.body;

    const inserted = await insertTeam({
      team_id,
      abbreviation,
      city,
      nickname,
      full_name,
      conference
    });

    res.json(inserted);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

router.get('/api/teams/db', async (req, res) => {
  try {
    const data = await getAllTeams();
    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});


router.put('/api/teams/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const {
      team_id,
      abbreviation,
      city,
      nickname,
      full_name,
      conference
    } = req.body;

    const updated = await updateTeam(id, {
      team_id,
      abbreviation,
      city,
      nickname,
      full_name,
      conference
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

module.exports = router;