const express = require('express');
const multer = require('multer');

const {
  getTeamsForFeatured,
  getAllTeamsForDropdown,
  getPlayersForFeatured,

  getFeaturedTeams,
  getFeaturedPlayers,

  insertFeaturedTeam,
  insertFeaturedPlayer,

  updateFeaturedTeamFeatured,
  updateFeaturedPlayerFeatured,

  uploadTeamLogo,
  uploadPlayerImage,

  updateFeaturedTeamLogo,
  updateFeaturedPlayerImage,

  deleteFeaturedTeam,
  deleteFeaturedPlayer
} = require('../supabase/featured.db');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage()
});

router.get('/api/featured/teams', async (req, res) => {
  try {
    const { conference = '' } = req.query;

    const data = await getTeamsForFeatured({
      conference
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

router.get('/api/featured/team-options', async (req, res) => {
  try {
    const data = await getAllTeamsForDropdown();

    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

router.get('/api/featured/players', async (req, res) => {
  try {
    const { teamId = '' } = req.query;

    const data = await getPlayersForFeatured({
      teamId
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

router.get('/api/featured/featured-teams', async (req, res) => {
  try {
    const data = await getFeaturedTeams();

    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

router.get('/api/featured/featured-players', async (req, res) => {
  try {
    const data = await getFeaturedPlayers();

    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

router.post('/api/featured/featured-teams', async (req, res) => {
  try {
    const {
      team_id,
      logo_url = null,
      featured = true,
      sort_order
    } = req.body;

    if (!team_id) {
      return res.status(400).json({
        error: 'team_id je obavezan.'
      });
    }

    if (sort_order === undefined || sort_order === null) {
      return res.status(400).json({
        error: 'sort_order je obavezan.'
      });
    }

    const data = await insertFeaturedTeam({
      team_id,
      logo_url,
      featured,
      sort_order
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

router.post('/api/featured/featured-players', async (req, res) => {
  try {
    const {
      player_id,
      image_url = null,
      featured = true,
      sort_order
    } = req.body;

    if (!player_id) {
      return res.status(400).json({
        error: 'player_id je obavezan.'
      });
    }

    if (sort_order === undefined || sort_order === null) {
      return res.status(400).json({
        error: 'sort_order je obavezan.'
      });
    }

    const data = await insertFeaturedPlayer({
      player_id,
      image_url,
      featured,
      sort_order
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

router.patch('/api/featured/featured-teams/:teamId/featured', async (req, res) => {
  try {
    const { teamId } = req.params;
    const { featured } = req.body;

    if (typeof featured !== 'boolean') {
      return res.status(400).json({
        error: 'featured mora biti boolean.'
      });
    }

    const data = await updateFeaturedTeamFeatured(
      teamId,
      featured
    );

    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

router.patch('/api/featured/featured-players/:playerId/featured', async (req, res) => {
  try {
    const { playerId } = req.params;
    const { featured } = req.body;

    if (typeof featured !== 'boolean') {
      return res.status(400).json({
        error: 'featured mora biti boolean.'
      });
    }

    const data = await updateFeaturedPlayerFeatured(
      playerId,
      featured
    );

    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

router.post(
  '/api/featured/featured-teams/:teamId/logo',
  upload.single('logo'),
  async (req, res) => {
    try {
      const { teamId } = req.params;

      if (!req.file) {
        return res.status(400).json({
          error: 'Logo file je obavezan.'
        });
      }

      const logoUrl = await uploadTeamLogo(
        teamId,
        req.file
      );

      const data = await updateFeaturedTeamLogo(
        teamId,
        logoUrl
      );

      res.json({
        logo_url: logoUrl,
        data
      });
    } catch (err) {
      res.status(500).json({
        error: err.message
      });
    }
  }
);

router.post(
  '/api/featured/featured-players/:playerId/image',
  upload.single('image'),
  async (req, res) => {
    try {
      const { playerId } = req.params;

      if (!req.file) {
        return res.status(400).json({
          error: 'Image file je obavezan.'
        });
      }

      const imageUrl = await uploadPlayerImage(
        playerId,
        req.file
      );

      const data = await updateFeaturedPlayerImage(
        playerId,
        imageUrl
      );

      res.json({
        image_url: imageUrl,
        data
      });
    } catch (err) {
      res.status(500).json({
        error: err.message
      });
    }
  }
);

router.delete('/api/featured/featured-teams/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;

    const data = await deleteFeaturedTeam(teamId);

    res.json({
      deleted: data.length,
      data
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

router.delete('/api/featured/featured-players/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;

    const data = await deleteFeaturedPlayer(playerId);

    res.json({
      deleted: data.length,
      data
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

module.exports = router;