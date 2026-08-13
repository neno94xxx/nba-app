const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildV2PlayerGameStatsRows,
  buildV3PlayerGameStatsRows,
  fetchPlayerGameStats
} = require('../src/api/playerGameStats.api');

test('maps V3 home and away players to the database schema', () => {
  const data = {
    boxScoreTraditional: {
      gameId: '0022500001',
      homeTeam: {
        teamId: 1,
        players: [{
          personId: 11,
          position: 'G',
          statistics: {
            minutes: '31:05',
            fieldGoalsMade: 7,
            fieldGoalsAttempted: 12,
            fieldGoalsPercentage: 0.583,
            threePointersMade: 2,
            threePointersAttempted: 4,
            threePointersPercentage: 0.5,
            freeThrowsMade: 3,
            freeThrowsAttempted: 3,
            freeThrowsPercentage: 1,
            reboundsOffensive: 1,
            reboundsDefensive: 4,
            reboundsTotal: 5,
            assists: 8,
            steals: 2,
            blocks: 1,
            turnovers: 3,
            foulsPersonal: 2,
            points: 19,
            plusMinusPoints: 6
          }
        }]
      },
      awayTeam: {
        teamId: 2,
        players: [{
          personId: 22,
          position: '',
          statistics: { minutes: '', points: 0, fieldGoalsMade: 0 }
        }]
      }
    }
  };

  const rows = buildV3PlayerGameStatsRows(data);

  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], {
    game_id: '0022500001', team_id: 1, player_id: 11,
    start_position: 'G', min: '31:05', fgm: 7, fga: 12,
    fg_pct: 0.583, fg3m: 2, fg3a: 4, fg3_pct: 0.5,
    ftm: 3, fta: 3, ft_pct: 1, oreb: 1, dreb: 4, reb: 5,
    ast: 8, stl: 2, blk: 1, turnovers: 3, pf: 2, pts: 19,
    plus_minus: 6
  });
  assert.equal(rows[1].start_position, null);
  assert.equal(rows[1].pts, null);
  assert.equal(rows[1].fgm, null);
});

test('maps the legacy V2 PlayerStats result set', () => {
  const headers = [
    'GAME_ID', 'TEAM_ID', 'PLAYER_ID', 'START_POSITION', 'MIN',
    'FGM', 'FGA', 'FG_PCT', 'FG3M', 'FG3A', 'FG3_PCT',
    'FTM', 'FTA', 'FT_PCT', 'OREB', 'DREB', 'REB', 'AST',
    'STL', 'BLK', 'TO', 'PF', 'PTS', 'PLUS_MINUS'
  ];
  const row = [
    '001', 1, 2, 'F', '20:00', 1, 2, 0.5, 1, 1, 1,
    0, 0, 0, 2, 3, 5, 4, 1, 0, 2, 3, 3, -1
  ];

  const rows = buildV2PlayerGameStatsRows({
    resultSets: [{ name: 'PlayerStats', headers, rowSet: [row] }]
  });

  assert.equal(rows.length, 1);
  assert.equal(rows[0].turnovers, 2);
  assert.equal(rows[0].plus_minus, -1);
});

test('uses V3 when it contains players', async () => {
  let v2Called = false;
  const result = await fetchPlayerGameStats('001', {
    fetchV3: async () => ({
      boxScoreTraditional: {
        gameId: '001',
        homeTeam: { teamId: 1, players: [{ personId: 2, statistics: {} }] },
        awayTeam: { teamId: 3, players: [] }
      }
    }),
    fetchV2: async () => {
      v2Called = true;
      return {};
    }
  });

  assert.equal(result.source, 'V3');
  assert.equal(result.rows.length, 1);
  assert.equal(v2Called, false);
});

test('falls back to V2 when V3 has no player rows', async () => {
  const headers = ['GAME_ID', 'TEAM_ID', 'PLAYER_ID'];
  const result = await fetchPlayerGameStats('001', {
    fetchV3: async () => ({ boxScoreTraditional: {} }),
    fetchV2: async () => ({
      resultSets: [{ name: 'PlayerStats', headers, rowSet: [['001', 1, 2]] }]
    })
  });

  assert.equal(result.source, 'V2');
  assert.equal(result.rows.length, 1);
});
