const test = require('node:test');
const assert = require('node:assert/strict');

const {
  aggregatePlayerGameStats
} = require('../src/services/playerGameStatsSummary');

test('aggregates played games and ignores DNP rows in per-game stats', () => {
  const players = [{
    player_id: 1,
    first_name: 'Test',
    last_name: 'Player',
    team_abbreviation: 'TST'
  }];
  const rows = [
    {
      game_id: '001', player_id: 1, start_position: 'G', min: '30:30',
      fgm: 5, fga: 10, fg3m: 2, fg3a: 4, ftm: 3, fta: 4,
      reb: 6, ast: 8, stl: 2, blk: 1, turnovers: 3, pts: 15,
      plus_minus: 4
    },
    {
      game_id: '002', player_id: 1, start_position: null, min: '20:30',
      fgm: 3, fga: 10, fg3m: 1, fg3a: 5, ftm: 1, fta: 2,
      reb: 4, ast: 2, stl: 0, blk: 1, turnovers: 1, pts: 8,
      plus_minus: -2
    },
    {
      game_id: '003', player_id: 1, start_position: null, min: null,
      fgm: null, fga: null, reb: null, ast: null, pts: null
    }
  ];

  const [summary] = aggregatePlayerGameStats(players, rows);

  assert.equal(summary.player_name, 'Test Player');
  assert.equal(summary.games_with_row, 3);
  assert.equal(summary.gp, 2);
  assert.equal(summary.gs, 1);
  assert.equal(summary.mpg, 25.5);
  assert.equal(summary.ppg, 11.5);
  assert.equal(summary.rpg, 5);
  assert.equal(summary.apg, 5);
  assert.equal(summary.fg_pct, 0.4);
  assert.equal(summary.fg3_pct, 0.333);
  assert.equal(summary.ft_pct, 0.667);
  assert.equal(summary.total_pts, 23);
});
