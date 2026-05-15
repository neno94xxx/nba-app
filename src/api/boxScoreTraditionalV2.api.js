async function fetchBoxScoreTraditionalV2(gameId) {
  const params = new URLSearchParams({
    GameID: gameId,
    StartPeriod: '0',
    EndPeriod: '0',
    StartRange: '0',
    EndRange: '0',
    RangeType: '0'
  });

  const url =
    `https://stats.nba.com/stats/boxscoretraditionalv2?${params.toString()}`;

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
  fetchBoxScoreTraditionalV2
};