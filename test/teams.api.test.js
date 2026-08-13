const test = require('node:test');
const assert = require('node:assert/strict');

const {
  fetchTeamsWithHeadCoaches,
  getActiveTeams,
  getHeadCoach,
  getDefaultNbaSeason
} = require('../src/api/teams.api');

function resultSet(name, headers, rowSet) {
  return { name, headers, rowSet };
}

test('returns only active NBA teams from the latest TeamYears season', () => {
  const data = {
    resultSets: [resultSet(
      'TeamYears',
      ['LEAGUE_ID', 'TEAM_ID', 'MIN_YEAR', 'MAX_YEAR', 'ABBREVIATION'],
      [
        ['00', 1, '1949', '1950', null],
        ['00', 2, '1980', '2026', 'BBB'],
        ['00', 3, '1970', '2026', 'AAA'],
        ['00', 4, '1990', '2025', 'OLD']
      ]
    )]
  };

  assert.deepEqual(getActiveTeams(data), [
    { teamId: 3, abbreviation: 'AAA' },
    { teamId: 2, abbreviation: 'BBB' }
  ]);
});

test('extracts the head coach and ignores assistants', () => {
  const data = {
    resultSets: [resultSet(
      'Coaches',
      ['COACH_ID', 'COACH_NAME', 'IS_ASSISTANT', 'COACH_TYPE'],
      [
        [20, 'Assistant Person', 2, 'Assistant Coach'],
        [10, 'Head Person', 1, 'Head Coach']
      ]
    )]
  };

  assert.deepEqual(getHeadCoach(data), {
    coachId: 10,
    coachName: 'Head Person'
  });
});

test('returns null when NBA omits the head coach row', () => {
  const data = {
    resultSets: [resultSet(
      'Coaches',
      ['COACH_ID', 'COACH_NAME', 'IS_ASSISTANT', 'COACH_TYPE'],
      [[20, 'Assistant Person', 2, 'Assistant Coach']]
    )]
  };

  assert.equal(getHeadCoach(data), null);
});

test('uses the previous start year before October', () => {
  assert.equal(
    getDefaultNbaSeason(new Date('2026-08-13T12:00:00Z')),
    '2025-26'
  );
  assert.equal(
    getDefaultNbaSeason(new Date('2026-10-13T12:00:00Z')),
    '2026-27'
  );
});

test('combines active teams with available head coaches', async () => {
  const teamsData = {
    resultSets: [resultSet(
      'TeamYears',
      ['TEAM_ID', 'MAX_YEAR', 'ABBREVIATION'],
      [[1, '2026', 'AAA'], [2, '2026', 'BBB']]
    )]
  };
  const rosterByTeam = {
    1: {
      resultSets: [resultSet(
        'Coaches',
        ['COACH_ID', 'COACH_NAME', 'IS_ASSISTANT', 'COACH_TYPE'],
        [[10, 'Coach One', 1, 'Head Coach']]
      )]
    },
    2: {
      resultSets: [resultSet(
        'Coaches',
        ['COACH_ID', 'COACH_NAME', 'IS_ASSISTANT', 'COACH_TYPE'],
        []
      )]
    }
  };

  const result = await fetchTeamsWithHeadCoaches({
    season: '2025-26',
    fetchTeamsFn: async () => teamsData,
    fetchTeamRosterFn: async (teamId) => rosterByTeam[teamId]
  });

  assert.equal(result.season, '2025-26');
  assert.deepEqual(result.teams, [
    { teamId: 1, abbreviation: 'AAA', coachId: 10, coachName: 'Coach One' },
    { teamId: 2, abbreviation: 'BBB', coachId: null, coachName: null }
  ]);
  assert.equal(result.warnings.length, 1);
});
