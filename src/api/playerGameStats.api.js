const {
  fetchBoxScoreTraditionalV2
} = require('./boxScoreTraditionalV2.api');
const {
  fetchBoxScoreTraditionalV3
} = require('./boxScoreTraditionalV3.api');

function rowToObject(headers, row) {
  return headers.reduce((result, header, index) => {
    result[header] = row[index];
    return result;
  }, {});
}

function mapV2PlayerToDbRow(player) {
  return {
    game_id: player.GAME_ID,
    team_id: player.TEAM_ID,
    player_id: player.PLAYER_ID,
    start_position: player.START_POSITION || null,
    min: player.MIN || null,
    fgm: player.FGM ?? null,
    fga: player.FGA ?? null,
    fg_pct: player.FG_PCT ?? null,
    fg3m: player.FG3M ?? null,
    fg3a: player.FG3A ?? null,
    fg3_pct: player.FG3_PCT ?? null,
    ftm: player.FTM ?? null,
    fta: player.FTA ?? null,
    ft_pct: player.FT_PCT ?? null,
    oreb: player.OREB ?? null,
    dreb: player.DREB ?? null,
    reb: player.REB ?? null,
    ast: player.AST ?? null,
    stl: player.STL ?? null,
    blk: player.BLK ?? null,
    turnovers: player.TO ?? null,
    pf: player.PF ?? null,
    pts: player.PTS ?? null,
    plus_minus: player.PLUS_MINUS ?? null
  };
}

function buildV2PlayerGameStatsRows(data) {
  const playerStats = data.resultSets?.find(
    (resultSet) => resultSet.name === 'PlayerStats'
  );

  if (!playerStats || !Array.isArray(playerStats.rowSet)) {
    return [];
  }

  return playerStats.rowSet
    .map((row) => rowToObject(playerStats.headers, row))
    .map(mapV2PlayerToDbRow)
    .filter((row) => row.game_id && row.team_id && row.player_id);
}

function mapV3PlayerToDbRow(gameId, teamId, player) {
  const stats = player.statistics || {};
  const minutes = stats.minutes || null;
  const didPlay = minutes !== null && minutes !== '00:00';
  const statValue = (name) => didPlay ? (stats[name] ?? null) : null;

  return {
    game_id: gameId,
    team_id: teamId,
    player_id: player.personId,
    start_position: player.position || null,
    min: minutes,
    fgm: statValue('fieldGoalsMade'),
    fga: statValue('fieldGoalsAttempted'),
    fg_pct: statValue('fieldGoalsPercentage'),
    fg3m: statValue('threePointersMade'),
    fg3a: statValue('threePointersAttempted'),
    fg3_pct: statValue('threePointersPercentage'),
    ftm: statValue('freeThrowsMade'),
    fta: statValue('freeThrowsAttempted'),
    ft_pct: statValue('freeThrowsPercentage'),
    oreb: statValue('reboundsOffensive'),
    dreb: statValue('reboundsDefensive'),
    reb: statValue('reboundsTotal'),
    ast: statValue('assists'),
    stl: statValue('steals'),
    blk: statValue('blocks'),
    turnovers: statValue('turnovers'),
    pf: statValue('foulsPersonal'),
    pts: statValue('points'),
    plus_minus: statValue('plusMinusPoints')
  };
}

function buildV3PlayerGameStatsRows(data, fallbackGameId) {
  const boxScore = data.boxScoreTraditional;

  if (!boxScore) {
    return [];
  }

  const gameId = boxScore.gameId || fallbackGameId;
  const teams = [boxScore.homeTeam, boxScore.awayTeam].filter(Boolean);

  return teams.flatMap((team) => {
    if (!Array.isArray(team.players)) {
      return [];
    }

    return team.players
      .filter((player) => player && player.personId)
      .map((player) => mapV3PlayerToDbRow(gameId, team.teamId, player));
  }).filter((row) => row.game_id && row.team_id && row.player_id);
}

async function fetchPlayerGameStats(
  gameId,
  {
    fetchV3 = fetchBoxScoreTraditionalV3,
    fetchV2 = fetchBoxScoreTraditionalV2
  } = {}
) {
  const failures = [];

  try {
    const data = await fetchV3(gameId);
    const rows = buildV3PlayerGameStatsRows(data, gameId);

    if (rows.length) {
      return { source: 'V3', rows };
    }

    failures.push('V3 nije vratio igrače');
  } catch (error) {
    failures.push(`V3: ${error.message}`);
  }

  try {
    const data = await fetchV2(gameId);
    const rows = buildV2PlayerGameStatsRows(data);

    if (rows.length) {
      return { source: 'V2', rows };
    }

    failures.push('V2 nije vratio igrače');
  } catch (error) {
    failures.push(`V2: ${error.message}`);
  }

  throw new Error(
    `NBA box score nema statistiku igrača za ${gameId}. ${failures.join('; ')}`
  );
}

module.exports = {
  buildV2PlayerGameStatsRows,
  buildV3PlayerGameStatsRows,
  fetchPlayerGameStats
};
