const express = require('express');
const multer = require('multer');
const {
  fetchTeamsWithHeadCoaches,
  getDefaultNbaSeason
} = require('../api/teams.api');
const {
  insertTeam,
  getAllTeams,
  updateTeam,
  replaceTeamCoachImage
} = require('../supabase/teams.db');

const router = express.Router();

const coachImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, callback) => {
    const allowedMimeTypes = new Set([
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif'
    ]);

    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new Error('Podržane su JPG, PNG, WEBP i GIF slike.'));
      return;
    }

    callback(null, true);
  }
});

function uploadCoachImage(req, res, next) {
  coachImageUpload.single('coach_image')(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    const message = error.code === 'LIMIT_FILE_SIZE'
      ? 'Slika trenera smije imati najviše 5 MB.'
      : error.message;

    res.status(400).json({ error: message });
  });
}

function toNullableInteger(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsedValue = Number(value);

  return Number.isInteger(parsedValue) ? parsedValue : null;
}

function buildTeamData(body) {
  return {
    team_id: toNullableInteger(body.team_id),
    abbreviation: body.abbreviation,
    city: body.city,
    nickname: body.nickname,
    full_name: body.full_name,
    conference: body.conference,
    coach_id: toNullableInteger(body.coach_id),
    coach_name: String(body.coach_name || '').trim() || null
  };
}

router.get('/api/teams', async (req, res) => {
  try {
    const season = String(
      req.query.season || getDefaultNbaSeason()
    ).trim();

    if (!/^\d{4}-\d{2}$/.test(season)) {
      return res.status(400).json({
        error: 'Season mora biti u formatu YYYY-YY, npr. 2025-26.'
      });
    }

    const data = await fetchTeamsWithHeadCoaches({ season });
    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});


router.post('/api/teams', async (req, res) => {
  try {
    const inserted = await insertTeam(buildTeamData(req.body));

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
    const updated = await updateTeam(id, buildTeamData(req.body));

    res.json(updated);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

router.post(
  '/api/teams/:id/coach-image',
  uploadCoachImage,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'Slika trenera je obavezna.'
        });
      }

      const replacement = await replaceTeamCoachImage(
        req.params.id,
        req.file
      );

      res.json({
        coach_image_url: replacement.publicUrl,
        data: replacement.data,
        cleanup_warning: replacement.cleanupWarning
      });
    } catch (err) {
      res.status(500).json({
        error: err.message
      });
    }
  }
);

module.exports = router;
