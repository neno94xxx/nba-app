async function fetchBoxScoreTraditionalV3(gameId) {
  const params = new URLSearchParams({
    GameID: gameId,
    LeagueID: '00'
  });

  const url =
    `https://stats.nba.com/stats/boxscoretraditionalv3?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Referer': 'https://www.nba.com/',
      'Origin': 'https://www.nba.com',
      'Accept': 'application/json, text/plain, */*'
    }
  });

  if (!response.ok) {
    throw new Error(`NBA API V3 vratio status ${response.status}`);
  }

  return response.json();
}

module.exports = {
  fetchBoxScoreTraditionalV3
};
