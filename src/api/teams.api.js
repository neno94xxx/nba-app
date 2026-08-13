const NBA_HEADERS = {
  'User-Agent': 'Mozilla/5.0',
  Referer: 'https://www.nba.com/',
  Origin: 'https://www.nba.com',
  Accept: 'application/json, text/plain, */*'
};

async function fetchNbaJson(url) {
  let lastError;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: NBA_HEADERS,
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) {
        throw new Error(`NBA API vratio status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error;

      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }
  }

  throw lastError;
}

async function fetchTeams() {
  return fetchNbaJson(
    'https://stats.nba.com/stats/commonteamyears?LeagueID=00'
  );
}

async function fetchTeamRoster(teamId, season) {
  const params = new URLSearchParams({
    LeagueID: '00',
    Season: season,
    TeamID: String(teamId)
  });

  return fetchNbaJson(
    `https://stats.nba.com/stats/commonteamroster?${params.toString()}`
  );
}

function getResultSetRows(data, resultSetName) {
  const resultSet = data.resultSets?.find(
    (item) => item.name === resultSetName
  );

  if (!resultSet || !Array.isArray(resultSet.rowSet)) {
    return [];
  }

  return resultSet.rowSet.map((row) => Object.fromEntries(
    resultSet.headers.map((header, index) => [header, row[index]])
  ));
}

function getActiveTeams(data) {
  const rows = getResultSetRows(data, 'TeamYears')
    .filter((row) => row.TEAM_ID && row.ABBREVIATION);
  const latestYear = Math.max(
    ...rows.map((row) => Number(row.MAX_YEAR)).filter(Number.isFinite)
  );

  return rows
    .filter((row) => Number(row.MAX_YEAR) === latestYear)
    .map((row) => ({
      teamId: row.TEAM_ID,
      abbreviation: row.ABBREVIATION
    }))
    .sort((a, b) => a.abbreviation.localeCompare(b.abbreviation));
}

function getHeadCoach(data) {
  const coaches = getResultSetRows(data, 'Coaches');

  const headCoach = coaches.find(
    (coach) =>
      String(coach.COACH_TYPE || '').trim().toLowerCase() === 'head coach'
  ) || coaches.find((coach) => Number(coach.IS_ASSISTANT) === 1);

  if (!headCoach) {
    return null;
  }

  return {
    coachId: headCoach.COACH_ID ?? null,
    coachName: headCoach.COACH_NAME ||
      `${headCoach.FIRST_NAME || ''} ${headCoach.LAST_NAME || ''}`.trim() ||
      null
  };
}

function getDefaultNbaSeason(referenceDate = new Date()) {
  const currentYear = referenceDate.getUTCFullYear();
  const seasonStartYear = referenceDate.getUTCMonth() >= 9
    ? currentYear
    : currentYear - 1;

  return `${seasonStartYear}-${String(seasonStartYear + 1).slice(-2)}`;
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index], index);
    }
  }

  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: workerCount }, worker));

  return results;
}

async function fetchTeamsWithHeadCoaches({
  season = getDefaultNbaSeason(),
  fetchTeamsFn = fetchTeams,
  fetchTeamRosterFn = fetchTeamRoster
} = {}) {
  const teamsData = await fetchTeamsFn();
  const activeTeams = getActiveTeams(teamsData);
  const warnings = [];

  const teams = await mapWithConcurrency(
    activeTeams,
    5,
    async (team) => {
      try {
        const rosterData = await fetchTeamRosterFn(team.teamId, season);
        const coach = getHeadCoach(rosterData);

        if (!coach) {
          warnings.push(
            `NBA nije vratio glavnog trenera za ${team.abbreviation}.`
          );
        }

        return {
          ...team,
          coachId: coach?.coachId ?? null,
          coachName: coach?.coachName ?? null
        };
      } catch (error) {
        warnings.push(
          `Trener za ${team.abbreviation} nije dohvaćen: ${error.message}`
        );

        return {
          ...team,
          coachId: null,
          coachName: null
        };
      }
    }
  );

  return {
    season,
    teams,
    warnings
  };
}

module.exports = {
  fetchTeams,
  fetchTeamRoster,
  fetchTeamsWithHeadCoaches,
  getActiveTeams,
  getHeadCoach,
  getDefaultNbaSeason
};
