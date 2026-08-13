const TOTAL_FIELDS = [
  'fgm', 'fga', 'fg3m', 'fg3a', 'ftm', 'fta',
  'oreb', 'dreb', 'reb', 'ast', 'stl', 'blk',
  'turnovers', 'pf', 'pts', 'plus_minus'
];

function round(value, digits) {
  if (!Number.isFinite(value)) {
    return null;
  }

  const multiplier = 10 ** digits;
  return Math.round((value + Number.EPSILON) * multiplier) / multiplier;
}

function ratio(numerator, denominator, digits) {
  if (!denominator) {
    return null;
  }

  return round(numerator / denominator, digits);
}

function parseMinutes(value) {
  if (!value) {
    return 0;
  }

  const [minutes, seconds = '0'] = String(value).split(':');
  const total = Number(minutes) + (Number(seconds) / 60);

  return Number.isFinite(total) ? total : 0;
}

function aggregatePlayerGameStats(players, rows) {
  const rowsByPlayerId = new Map();

  rows.forEach((row) => {
    const playerId = String(row.player_id);

    if (!rowsByPlayerId.has(playerId)) {
      rowsByPlayerId.set(playerId, []);
    }

    rowsByPlayerId.get(playerId).push(row);
  });

  return players.map((player) => {
    const playerRows = rowsByPlayerId.get(String(player.player_id)) || [];
    const gamesWithRow = new Set();
    const gamesPlayed = new Set();
    const gamesStarted = new Set();
    const totals = Object.fromEntries(TOTAL_FIELDS.map((field) => [field, 0]));
    let totalMinutes = 0;

    playerRows.forEach((row) => {
      gamesWithRow.add(String(row.game_id));

      if (row.min) {
        gamesPlayed.add(String(row.game_id));
        totalMinutes += parseMinutes(row.min);
      }

      if (row.min && row.start_position) {
        gamesStarted.add(String(row.game_id));
      }

      TOTAL_FIELDS.forEach((field) => {
        const value = Number(row[field]);

        if (Number.isFinite(value)) {
          totals[field] += value;
        }
      });
    });

    const gp = gamesPlayed.size;

    return {
      player_id: player.player_id,
      player_name: `${player.first_name || ''} ${player.last_name || ''}`.trim(),
      team_abbreviation: player.team_abbreviation || null,
      games_with_row: gamesWithRow.size,
      gp,
      gs: gamesStarted.size,
      mpg: ratio(totalMinutes, gp, 1),
      ppg: ratio(totals.pts, gp, 1),
      rpg: ratio(totals.reb, gp, 1),
      apg: ratio(totals.ast, gp, 1),
      spg: ratio(totals.stl, gp, 1),
      bpg: ratio(totals.blk, gp, 1),
      tov_pg: ratio(totals.turnovers, gp, 1),
      plus_minus_pg: ratio(totals.plus_minus, gp, 1),
      fg_pct: ratio(totals.fgm, totals.fga, 3),
      fg3_pct: ratio(totals.fg3m, totals.fg3a, 3),
      ft_pct: ratio(totals.ftm, totals.fta, 3),
      total_pts: totals.pts,
      total_reb: totals.reb,
      total_ast: totals.ast,
      total_stl: totals.stl,
      total_blk: totals.blk,
      total_turnovers: totals.turnovers,
      fgm: totals.fgm,
      fga: totals.fga,
      fg3m: totals.fg3m,
      fg3a: totals.fg3a,
      ftm: totals.ftm,
      fta: totals.fta
    };
  });
}

module.exports = {
  aggregatePlayerGameStats
};
