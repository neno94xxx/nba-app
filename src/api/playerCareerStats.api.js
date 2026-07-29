async function fetchPlayerCareerStats(playerId) {
  const params = new URLSearchParams({
    PlayerID: String(playerId),
    PerMode: 'Totals',
    LeagueID: '00'
  });

  const url =
    `https://stats.nba.com/stats/playercareerstats?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Referer': 'https://www.nba.com/',
      'Origin': 'https://www.nba.com',
      'Accept': 'application/json, text/plain, */*'
    }
  });

  if (!response.ok) {
    throw new Error(`NBA API vratio status ${response.status}`);
  }

  return response.json();
}

module.exports = {
  fetchPlayerCareerStats
};