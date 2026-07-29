const express = require('express');

const { fetchPlayersBySeason } = require('../api/players.api');
const { fetchPlayerInfo } = require('../api/playerInfo.api');
const { fetchPlayerGameLog } = require('../api/playerGameLog.api');
const { fetchPlayerCareerStats } = require('../api/playerCareerStats.api');

const {
  insertPlayer,
  getAllPlayers,
  updatePlayer
} = require('../supabase/players.db');

const {
  insertPlayerTeamHistory,
  deletePlayerTeamHistory,
  getPlayerTeamHistory
} = require('../supabase/playerTeamHistory.db');

const {
  deletePlayerCareerStats,
  insertPlayerSeasonTotals,
  insertPlayerCareerTotals
} = require('../supabase/playerCareerStats.db');

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
        error:
          'Nedostaje query parametar "playerId". Primjer: /api/player-info?playerId=1630173'
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
        error:
          'Nedostaje playerId ili season. Primjer: /api/player-gamelog?playerId=1629029&season=2025-26'
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

function getResultSet(data, name) {
  return data.resultSets?.find((set) => set.name === name);
}

function mapRowToObject(headers, row) {
  const obj = {};

  headers.forEach((header, index) => {
    obj[header] = row[index];
  });

  return obj;
}

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return null;
  }

  return numberValue;
}

function toIntegerOrNull(value) {
  const numberValue = toNumberOrNull(value);

  if (numberValue === null) {
    return null;
  }

  return Math.trunc(numberValue);
}

function mapSeasonTotalRow(playerId, seasonType, rowObj) {
  return {
    player_id: toIntegerOrNull(playerId),
    season: seasonType,
    season_id: rowObj.SEASON_ID ?? null,
    league_id: rowObj.LEAGUE_ID ?? null,

    team_id: toIntegerOrNull(rowObj.TEAM_ID),
    team_abbreviation: rowObj.TEAM_ABBREVIATION ?? null,
    player_age: toNumberOrNull(rowObj.PLAYER_AGE),

    gp: toIntegerOrNull(rowObj.GP),
    gs: toIntegerOrNull(rowObj.GS),
    min: toNumberOrNull(rowObj.MIN),

    fgm: toIntegerOrNull(rowObj.FGM),
    fga: toIntegerOrNull(rowObj.FGA),
    fg_pct: toNumberOrNull(rowObj.FG_PCT),

    fg3m: toIntegerOrNull(rowObj.FG3M),
    fg3a: toIntegerOrNull(rowObj.FG3A),
    fg3_pct: toNumberOrNull(rowObj.FG3_PCT),

    ftm: toIntegerOrNull(rowObj.FTM),
    fta: toIntegerOrNull(rowObj.FTA),
    ft_pct: toNumberOrNull(rowObj.FT_PCT),

    oreb: toIntegerOrNull(rowObj.OREB),
    dreb: toIntegerOrNull(rowObj.DREB),
    reb: toIntegerOrNull(rowObj.REB),

    ast: toIntegerOrNull(rowObj.AST),
    stl: toIntegerOrNull(rowObj.STL),
    blk: toIntegerOrNull(rowObj.BLK),
    tov: toIntegerOrNull(rowObj.TOV),
    pf: toIntegerOrNull(rowObj.PF),
    pts: toIntegerOrNull(rowObj.PTS)
  };
}

function mapCareerTotalRow(playerId, seasonType, rowObj) {
  return {
    player_id: toIntegerOrNull(playerId),
    season: seasonType,
    league_id: rowObj.LEAGUE_ID ?? null,

    gp: toIntegerOrNull(rowObj.GP),
    gs: toIntegerOrNull(rowObj.GS),
    min: toNumberOrNull(rowObj.MIN),

    fgm: toIntegerOrNull(rowObj.FGM),
    fga: toIntegerOrNull(rowObj.FGA),
    fg_pct: toNumberOrNull(rowObj.FG_PCT),

    fg3m: toIntegerOrNull(rowObj.FG3M),
    fg3a: toIntegerOrNull(rowObj.FG3A),
    fg3_pct: toNumberOrNull(rowObj.FG3_PCT),

    ftm: toIntegerOrNull(rowObj.FTM),
    fta: toIntegerOrNull(rowObj.FTA),
    ft_pct: toNumberOrNull(rowObj.FT_PCT),

    oreb: toIntegerOrNull(rowObj.OREB),
    dreb: toIntegerOrNull(rowObj.DREB),
    reb: toIntegerOrNull(rowObj.REB),

    ast: toIntegerOrNull(rowObj.AST),
    stl: toIntegerOrNull(rowObj.STL),
    blk: toIntegerOrNull(rowObj.BLK),
    tov: toIntegerOrNull(rowObj.TOV),
    pf: toIntegerOrNull(rowObj.PF),
    pts: toIntegerOrNull(rowObj.PTS)
  };
}

function buildCareerStatsRows(playerId, data) {
  const seasonRows = [];
  const careerRows = [];

  const regularSeasonSet = getResultSet(
    data,
    'SeasonTotalsRegularSeason'
  );

  const regularCareerSet = getResultSet(
    data,
    'CareerTotalsRegularSeason'
  );

  const playoffSeasonSet = getResultSet(
    data,
    'SeasonTotalsPostSeason'
  );

  const playoffCareerSet = getResultSet(
    data,
    'CareerTotalsPostSeason'
  );

  if (regularSeasonSet) {
    regularSeasonSet.rowSet.forEach((row) => {
      const rowObj = mapRowToObject(
        regularSeasonSet.headers,
        row
      );

      seasonRows.push(
        mapSeasonTotalRow(playerId, 'REG', rowObj)
      );
    });
  }

  if (playoffSeasonSet) {
    playoffSeasonSet.rowSet.forEach((row) => {
      const rowObj = mapRowToObject(
        playoffSeasonSet.headers,
        row
      );

      seasonRows.push(
        mapSeasonTotalRow(playerId, 'POF', rowObj)
      );
    });
  }

  if (regularCareerSet) {
    regularCareerSet.rowSet.forEach((row) => {
      const rowObj = mapRowToObject(
        regularCareerSet.headers,
        row
      );

      careerRows.push(
        mapCareerTotalRow(playerId, 'REG', rowObj)
      );
    });
  }

  if (playoffCareerSet) {
    playoffCareerSet.rowSet.forEach((row) => {
      const rowObj = mapRowToObject(
        playoffCareerSet.headers,
        row
      );

      careerRows.push(
        mapCareerTotalRow(playerId, 'POF', rowObj)
      );
    });
  }

  return {
    seasonRows,
    careerRows
  };
}

router.post('/api/player-career-stats/update-players', async (req, res) => {
  try {
    const { players } = req.body;

    if (!Array.isArray(players) || !players.length) {
      return res.status(400).json({
        error: 'Body mora sadržavati players array.'
      });
    }

    const results = [];

    for (const player of players) {
      try {
        if (!player.player_id) {
          results.push({
            player_id: null,
            first_name: player.first_name ?? '',
            last_name: player.last_name ?? '',
            success: false,
            error: 'Nedostaje player_id.'
          });

          continue;
        }

        console.log(
          `Updating career stats for player ${player.player_id} ` +
          `${player.first_name || ''} ${player.last_name || ''}`
        );

        const data = await fetchPlayerCareerStats(player.player_id);

        const { seasonRows, careerRows } = buildCareerStatsRows(
          player.player_id,
          data
        );

        await deletePlayerCareerStats(player.player_id);

        const insertedSeasonRows =
          await insertPlayerSeasonTotals(seasonRows);

        const insertedCareerRows =
          await insertPlayerCareerTotals(careerRows);

        results.push({
          player_id: player.player_id,
          first_name: player.first_name,
          last_name: player.last_name,
          success: true,
          season_rows_inserted: insertedSeasonRows.length,
          career_rows_inserted: insertedCareerRows.length
        });
      } catch (playerError) {
        console.error(
          `Greška kod updatea career statsa za player ${player.player_id}:`,
          playerError
        );

        results.push({
          player_id: player.player_id,
          first_name: player.first_name,
          last_name: player.last_name,
          success: false,
          error: playerError.message
        });
      }
    }

    res.json({
      players_received: players.length,
      results
    });
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