const express = require('express');
const { fetchPlayByPlay } = require('../api/playByPlay.api');
const {  fetchBoxScoreTraditionalV2} = require('../api/boxScoreTraditionalV2.api');
const {insertLineupTimeline, insertPlayByPlay} = require('../supabase/playByPlay.db');



const router = express.Router();

router.get('/api/play-by-play', async (req, res) => {
  try {
    const { gameId } = req.query;

    if (!gameId) {
      return res.status(400).json({
        error: 'Nedostaje query parametar "gameId". Primjer: /api/play-by-play?gameId=0022401071'
      });
    }

    const data = await fetchPlayByPlay(gameId);
    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});









router.get('/api/boxscore/traditional-v2', async (req, res) => {
  try {
    const { gameId } = req.query;

    if (!gameId) {
      return res.status(400).json({
        error:
          'Nedostaje query parametar "gameId".'
      });
    }

    const data =
      await fetchBoxScoreTraditionalV2(gameId);

    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});





router.post('/api/lineup-timeline/import', async (req, res) => {
  try {
    const { rows } = req.body;

    if (!Array.isArray(rows) || !rows.length) {
      return res.status(400).json({
        error: 'Rows array je obavezan.'
      });
    }

    const data = await insertLineupTimeline(rows);

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



router.post('/api/play-by-play/import', async (req, res) => {
  try {
    const { rows } = req.body;

    if (!Array.isArray(rows) || !rows.length) {
      return res.status(400).json({
        error: 'Rows array je obavezan.'
      });
    }

    const data = await insertPlayByPlay(rows);

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

module.exports = router;